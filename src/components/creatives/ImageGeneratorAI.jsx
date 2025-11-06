import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Sparkles, Loader2, Image as ImageIcon, Download, Trash2, MessageSquare, Plus, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    
    // Extract image URLs from assistant messages
    const imageUrls = [];
    if (!isUser && message.content) {
        const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/gi;
        const matches = message.content.match(urlRegex);
        if (matches) {
            imageUrls.push(...matches);
        }
    }
    
    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isUser && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            )}
            <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                    isUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-foreground border border-border'
                }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Display attached files */}
                {message.file_urls && message.file_urls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.file_urls.map((url, idx) => (
                            <img 
                                key={idx} 
                                src={url} 
                                alt="Attached" 
                                className="rounded-lg max-w-[200px] border border-border"
                            />
                        ))}
                    </div>
                )}
                
                {/* Display generated images from assistant messages */}
                {imageUrls.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {imageUrls.map((url, idx) => (
                            <div key={idx} className="relative group">
                                <img 
                                    src={url} 
                                    alt="Generated" 
                                    className="rounded-lg border border-border shadow-lg max-w-full"
                                />
                                <a 
                                    href={url} 
                                    download={`ai-generated-${Date.now()}.png`}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Button size="sm" variant="secondary">
                                        <Download className="w-4 h-4 mr-1" />
                                        Save
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {isUser && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
        </div>
    );
};

export default function ImageGeneratorAI() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    // Subscribe to conversation updates
    useEffect(() => {
        if (!selectedConversationId) return;

        const unsubscribe = base44.agents.subscribeToConversation(selectedConversationId, (data) => {
            setMessages(data.messages || []);
            setIsLoading(false);
        });

        // Load initial messages
        loadConversationMessages(selectedConversationId);

        return () => {
            unsubscribe();
        };
    }, [selectedConversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const convos = await base44.agents.listConversations({
                agent_name: 'image_designer'
            });
            setConversations(convos);
            
            if (convos.length > 0 && !selectedConversationId) {
                setSelectedConversationId(convos[0].id);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadConversationMessages = async (conversationId) => {
        try {
            const conversation = await base44.agents.getConversation(conversationId);
            setMessages(conversation.messages || []);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const createNewConversation = async () => {
        try {
            const conversation = await base44.agents.createConversation({
                agent_name: 'image_designer',
                metadata: {
                    name: `Image Design ${new Date().toLocaleDateString()}`,
                    description: 'AI Image Generation Session'
                }
            });
            
            await loadConversations();
            setSelectedConversationId(conversation.id);
            toast({ title: 'New Session', description: 'Started a new image design conversation.' });
        } catch (error) {
            console.error('Failed to create conversation:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create new conversation.' });
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadedUrls = [];
            for (const file of files) {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                uploadedUrls.push(file_url);
            }
            setUploadedFiles(prev => [...prev, ...uploadedUrls]);
            toast({ title: 'Uploaded', description: `${files.length} file(s) uploaded successfully.` });
        } catch (error) {
            console.error('Upload error:', error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload files.' });
        } finally {
            setIsUploading(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() && uploadedFiles.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Message', description: 'Please enter a message or upload a file.' });
            return;
        }

        if (!selectedConversationId) {
            toast({ variant: 'destructive', title: 'No Conversation', description: 'Please create a new session first.' });
            return;
        }

        setIsLoading(true);
        try {
            const conversation = await base44.agents.getConversation(selectedConversationId);
            
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: inputMessage || 'Please analyze these images.',
                file_urls: uploadedFiles.length > 0 ? uploadedFiles : undefined
            });

            setInputMessage('');
            setUploadedFiles([]);
        } catch (error) {
            console.error('Failed to send message:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' });
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations Sidebar */}
            <Card className="lg:col-span-1 bg-card border-border flex flex-col">
                <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Sessions</CardTitle>
                        <Button size="sm" onClick={createNewConversation}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {conversations.map(convo => (
                            <Button
                                key={convo.id}
                                variant={selectedConversationId === convo.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start text-left"
                                onClick={() => setSelectedConversationId(convo.id)}
                            >
                                <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">
                                    {convo.metadata?.name || `Session ${convo.id.substring(0, 8)}`}
                                </span>
                            </Button>
                        ))}
                        {conversations.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No sessions yet</p>
                                <p className="text-xs">Create one to start</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-3 bg-card border-border flex flex-col">
                <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-base">AI Image Designer</CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {selectedConversation?.metadata?.name || 'Select or create a session'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-4 max-w-md">
                                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold">AI Image Designer</h3>
                                <p className="text-muted-foreground">
                                    Describe the image you want to create, or upload a photo to modify. 
                                    I'll help you refine it through conversation.
                                </p>
                                <div className="text-left bg-secondary rounded-lg p-4 space-y-2 text-sm">
                                    <p className="font-semibold">Try asking:</p>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• "Create a modern office workspace with natural light"</li>
                                        <li>• "Make this photo more vibrant and add a sunset"</li>
                                        <li>• "Generate a futuristic cityscape at night"</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {messages.map((msg, idx) => (
                                <MessageBubble key={idx} message={msg} />
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">AI is thinking and creating...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-border p-4 space-y-3">
                    {/* Uploaded Files Preview */}
                    {uploadedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {uploadedFiles.map((url, idx) => (
                                <div key={idx} className="relative group">
                                    <img 
                                        src={url} 
                                        alt="To upload" 
                                        className="w-16 h-16 object-cover rounded border border-border"
                                    />
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploading || !selectedConversationId}
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                        
                        <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                selectedConversationId 
                                    ? "Describe what you want to create or how to refine the image..." 
                                    : "Create a new session to start"
                            }
                            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                            disabled={isLoading || !selectedConversationId}
                        />
                        
                        <Button
                            onClick={sendMessage}
                            disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0) || !selectedConversationId}
                            className="self-end"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </Card>
        </div>
    );
}