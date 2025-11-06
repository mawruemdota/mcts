
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ARExperience } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Edit, Loader2, Upload, QrCode, Copy, Eye, Download, Info, ExternalLink, Image as ImageIcon, Zap, Wand2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { UploadFile, InvokeLLM, GenerateImage } from '@/integrations/Core';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const MarkerAnalysis = ({ analysis }) => {
    if (!analysis) return null;

    return (
        <div className="mt-4 p-3 bg-secondary/70 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2">Marker Effectiveness Analysis</h4>
            <div className="flex items-center gap-3 mb-2">
                <Progress value={analysis.score} className="w-full [&>*]:bg-primary" />
                <span className="font-bold text-lg">{analysis.score}/100</span>
            </div>
            <p className="text-sm text-muted-foreground italic mb-3">"{analysis.summary}"</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
                {analysis.feedback.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

const ExperienceForm = ({ experience, onSubmitted }) => {
    const [formData, setFormData] = useState(experience || {
        name: '',
        description: '',
        marker_image_url: '',
        marker_pattern_url: '',
        model_3d_url: ''
    });
    const [isUploading, setIsUploading] = useState({ marker: false, model: false, pattern: false });
    // isGeneratingPattern removed as automatic generation is no longer supported
    const [isGeneratingTestMarker, setIsGeneratingTestMarker] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [markerAnalysis, setMarkerAnalysis] = useState(null);
    const markerInputRef = useRef(null);
    const modelInputRef = useRef(null);
    const patternInputRef = useRef(null);
    const { toast } = useToast();

    const analyzeMarker = async (imageUrl) => {
        setIsAnalyzing(true);
        setMarkerAnalysis(null);
        try {
            const response = await InvokeLLM({
                prompt: `You are an expert in Augmented Reality marker design. Analyze the provided image to determine its effectiveness as an AR.js marker.

Based on the image, provide a score from 0 to 100, where 100 is a perfect marker.
Also, provide a short, one-sentence summary of its quality.
Finally, give a list of feedback points (pros and cons).

Consider these factors in your analysis:
- High contrast
- Asymmetry
- Presence of sharp, distinct corners and edges
- Non-repetitive patterns
- A clear, thick border (if present)

Return your analysis in a JSON object with the following structure:
{
  "score": number, // 0-100
  "summary": string,
  "feedback": string[] // list of pros and cons
}`,
                file_urls: [imageUrl],
                response_json_schema: {
                    type: "object",
                    properties: {
                        score: { type: "number" },
                        summary: { type: "string" },
                        feedback: { type: "array", items: { type: "string" } }
                    },
                    required: ["score", "summary", "feedback"]
                }
            });
            setMarkerAnalysis(response);
        } catch (error) {
            console.error("Marker analysis failed:", error);
            toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not analyze the marker image.' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = async (file, type) => {
        if (!file) return;
        setIsUploading(prev => ({...prev, [type]: true}));
        
        const fieldMap = {
            marker: 'marker_image_url',
            model: 'model_3d_url',
            pattern: 'marker_pattern_url'
        };

        try {
            const { file_url } = await UploadFile({ file });
            setFormData(prev => ({ ...prev, [fieldMap[type]]: file_url }));
            toast({ title: "Success", description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded.` });
            if (type === 'marker') {
                analyzeMarker(file_url);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the file.' });
        } finally {
            setIsUploading(prev => ({...prev, [type]: false}));
        }
    };

    // generatePatternAutomatically function removed as automatic generation is no longer supported
    
    const generateTestMarkerAndPattern = async () => {
        setIsGeneratingTestMarker(true);
        try {
            toast({ title: "Generating Test Marker...", description: "This can take a moment. Please wait..." });
            const imageResponse = await GenerateImage({ 
                prompt: "A high-contrast, asymmetrical, black and white abstract geometric pattern suitable for a highly effective AR.js marker. The image must be square and contain sharp, distinct features with no repetitive elements. Include a thick black border around the edge."
            });
            const markerUrl = imageResponse.url;
            setFormData(prev => ({ ...prev, marker_image_url: markerUrl, marker_pattern_url: '' })); // Reset pattern URL
            analyzeMarker(markerUrl);

            toast({ 
                variant: 'default',
                title: "Marker Generated!", 
                description: "Now, please use the external generator in Step 2 to create and upload the pattern file for this new marker.",
                duration: 7000
            });

        } catch (error) {
            console.error("Test marker generation failed:", error);
            toast({ variant: 'destructive', title: 'Test Marker Failed', description: 'Could not generate a test marker.' });
        } finally {
            setIsGeneratingTestMarker(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.marker_image_url || !formData.model_3d_url || !formData.marker_pattern_url) {
            toast({ variant: 'destructive', title: 'Missing Files', description: 'Please complete all steps to save.' });
            return;
        }

        try {
            if (experience?.id) {
                await ARExperience.update(experience.id, formData);
                toast({ title: "Success", description: "AR Experience updated." });
            } else {
                await ARExperience.create(formData);
                toast({ title: "Success", description: "AR Experience created." });
            }
            onSubmitted();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save experience." });
        }
    };

    const isStep2Disabled = !formData.marker_image_url;
    const isStep3Disabled = !formData.marker_image_url || !formData.marker_pattern_url;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Experience Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <Button type="button" onClick={generateTestMarkerAndPattern} disabled={isGeneratingTestMarker} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isGeneratingTestMarker ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Wand2 className="w-4 h-4 mr-2"/>}
                Generate a Test Marker Image
            </Button>
            <p className="text-center text-xs text-muted-foreground">OR</p>

            <Card className="bg-secondary/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Step 1: Upload Marker Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-start p-3 bg-background/80 rounded-md border text-sm">
                    <Info className="w-5 h-5 mr-3 mt-0.5 text-blue-500 flex-shrink-0" />
                    <div>
                        Upload a distinct, high-contrast image to be your AR marker. A good marker is asymmetrical and has sharp details.
                    </div>
                </div>
                <input type="file" ref={markerInputRef} onChange={(e) => handleFileUpload(e.target.files[0], 'marker')} accept="image/png, image/jpeg" className="hidden"/>
                <Button type="button" variant="outline" onClick={() => markerInputRef.current.click()} disabled={isUploading.marker || isGeneratingTestMarker} className="w-full">
                    {isUploading.marker ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <ImageIcon className="w-4 h-4 mr-2"/>}
                    Upload Marker Image (.png, .jpg)
                </Button>
                {formData.marker_image_url && (
                    <div className="mt-2 text-center">
                        <img src={formData.marker_image_url} alt="Marker preview" className="rounded-md h-24 w-24 object-cover inline-block border"/>
                    </div>
                )}
                {isAnalyzing && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing marker effectiveness...</span>
                    </div>
                )}
                <MarkerAnalysis analysis={markerAnalysis} />
              </CardContent>
            </Card>

            <Card className={cn("bg-secondary/50 transition-opacity", isStep2Disabled && "opacity-50")}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Step 2: Create & Upload Pattern File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 text-sm">
                    <Info className="w-5 h-5 mr-3 mt-0.5 text-blue-500 flex-shrink-0" />
                    <div>
                        <span className="font-bold">This is a required step.</span> You must use the official AR.js generator to create a pattern (`.patt`) file from your marker image. This ensures the best tracking performance.
                    </div>
                 </div>
                
                 <a href="https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html" target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" className="w-full" disabled={isStep2Disabled}>
                        1. Open Pattern Generator <ExternalLink className="w-4 h-4 ml-2"/>
                    </Button>
                </a>
                <p className="text-xs text-muted-foreground text-center">After generating, download the `.patt` file and upload it below.</p>
                <input type="file" ref={patternInputRef} onChange={(e) => handleFileUpload(e.target.files[0], 'pattern')} accept=".patt" className="hidden"/>
                <Button type="button" variant="outline" onClick={() => patternInputRef.current.click()} disabled={isUploading.pattern || isStep2Disabled} className="w-full">
                    {isUploading.pattern ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
                    2. Upload Pattern File (.patt)
                </Button>

                {formData.marker_pattern_url && (
                    <div className="text-center">
                        <p className="text-xs text-green-600 mt-2">✔️ Pattern file ready!</p>
                    </div>
                )}
              </CardContent>
            </Card>
            
            <Card className={cn("bg-secondary/50 transition-opacity", isStep3Disabled && "opacity-50")}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Step 3: Upload 3D Model</CardTitle>
              </CardHeader>
              <CardContent>
                <input type="file" ref={modelInputRef} onChange={(e) => handleFileUpload(e.target.files[0], 'model')} accept=".glb,.gltf" className="hidden"/>
                <Button type="button" variant="outline" onClick={() => modelInputRef.current.click()} disabled={isUploading.model || isStep3Disabled || isGeneratingTestMarker} className="w-full">
                    {isUploading.model ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
                    Upload Model (.glb, .gltf)
                </Button>
                {formData.model_3d_url && <p className="text-xs text-muted-foreground truncate mt-2">Uploaded: {formData.model_3d_url.split('/').pop()}</p>}
              </CardContent>
            </Card>
            
            <DialogFooter>
                <Button type="submit" disabled={isUploading.marker || isUploading.model || isUploading.pattern || isGeneratingTestMarker || isAnalyzing || !formData.marker_image_url || !formData.marker_pattern_url || !formData.model_3d_url}>
                    Save Experience
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function WebARManager() {
    const [experiences, setExperiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const { toast } = useToast();

    const loadExperiences = useCallback(async () => {
        setIsLoading(true);
        const data = await ARExperience.list();
        setExperiences(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadExperiences();
    }, [loadExperiences]);
    
    const onFormSubmitted = () => {
        setShowForm(false);
        setEditingExperience(null);
        loadExperiences();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this AR experience?")) {
            await ARExperience.delete(id);
            toast({ title: "Deleted", description: "AR Experience has been deleted." });
            loadExperiences();
        }
    };

    const copyPublicLink = (id) => {
        const url = `${window.location.origin}${createPageUrl(`ARView?id=${id}`)}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link Copied!', description: 'Public view link is copied to your clipboard.' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">WebAR Experiences</h2>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingExperience(null)}><Plus className="w-4 h-4 mr-2" />New Experience</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingExperience ? 'Edit' : 'New'} AR Experience</DialogTitle>
                        </DialogHeader>
                        <ExperienceForm experience={editingExperience} onSubmitted={onFormSubmitted} />
                    </DialogContent>
                </Dialog>
            </div>
            {isLoading ? <p>Loading experiences...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {experiences.map(exp => (
                        <Card key={exp.id} className="flex flex-col">
                            <CardHeader>
                                <img src={exp.marker_image_url} alt={exp.name} className="w-full h-40 object-cover rounded-md bg-secondary" />
                            </CardHeader>
                            <CardContent className="flex-1">
                                <CardTitle>{exp.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}${createPageUrl(`ARView?id=${exp.id}`)}`)}`} 
                                    alt="QR Code"
                                    className="mt-4 rounded-md mx-auto"
                                />
                                <p className="text-xs text-muted-foreground text-center mt-2">Scan to view in AR</p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => copyPublicLink(exp.id)} title="Copy AR View Link">
                                    <Copy className="w-4 h-4"/>
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" title="Download Files">
                                        <Download className="w-4 h-4"/>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem asChild>
                                        <a href={exp.marker_image_url} download={`marker-${exp.name.replace(/\s+/g, '-')}.png`} target="_blank" rel="noopener noreferrer">
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          Download Marker Image
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <a href={exp.marker_pattern_url} download={`pattern-${exp.name.replace(/\s+/g, '-')}.patt`} target="_blank" rel="noopener noreferrer">
                                          <QrCode className="w-4 h-4 mr-2" />
                                          Download Pattern File
                                        </a>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={() => { setEditingExperience(exp); setShowForm(true); }}>
                                      <Edit className="w-4 h-4"/>
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(exp.id)}>
                                      <Trash2 className="w-4 h-4"/>
                                    </Button>
                                    <a href={createPageUrl(`ARView?id=${exp.id}`)} target="_blank" rel="noopener noreferrer">
                                        <Button size="icon">
                                          <Eye className="w-4 h-4"/>
                                        </Button>
                                    </a>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            {!isLoading && experiences.length === 0 && <p className="text-center py-10 text-muted-foreground">No AR experiences yet. Create one to get started!</p>}
        </div>
    );
}
