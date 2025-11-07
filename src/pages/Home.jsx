
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Printer,
  Palette,
  Package,
  Zap,
  Users,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  FileText,
  Image as ImageIcon } from
'lucide-react';

export default function HomePage() {
  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const services = [
  {
    icon: Printer,
    title: 'Digital Printing',
    description: 'High-quality tarpaulins, stickers, banners, and large format printing for all your business needs.',
    color: 'bg-blue-500'
  },
  {
    icon: FileText,
    title: 'Business Cards & IDs',
    description: 'Professional business cards, calling cards, and employee ID printing with quick turnaround.',
    color: 'bg-green-500'
  },
  {
    icon: ImageIcon,
    title: 'Promotional Materials',
    description: 'Eye-catching flyers, brochures, invitations, and marketing materials to boost your brand.',
    color: 'bg-purple-500'
  },
  {
    icon: Palette,
    title: 'Creative Design',
    description: 'Expert graphic design services, social media content creation, and brand identity development.',
    color: 'bg-pink-500'
  },
  {
    icon: Sparkles,
    title: 'Creative Tech Solutions',
    description: 'Cutting-edge augmented reality solutions to make your marketing campaigns truly interactive.',
    color: 'bg-orange-500'
  },
  {
    icon: Package,
    title: 'Rush Orders',
    description: 'Need it fast? We offer rush services to meet your urgent deadlines without compromising quality.',
    color: 'bg-red-500'
  }];


  const features = [
  { icon: Zap, text: 'Fast Turnaround' },
  { icon: CheckCircle, text: 'Quality Guaranteed' },
  { icon: Users, text: 'Expert Team' },
  { icon: Package, text: 'Competitive Pricing' }];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-[#2053E6] border-b border-[#1a45c4] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                alt="MCTS Logo"
                className="h-10 w-auto" />

              <div>
                <h1 className="text-xl font-bold text-white">MCTS</h1>
                <p className="text-xs text-white/90">Printing & Design Solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="#services" className="text-white/90 hover:text-white transition-colors hidden md:block">
                Services
              </a>
              <a href="#contact" className="text-white/90 hover:text-white transition-colors hidden md:block">
                Contact
              </a>
              <Button onClick={handleLogin} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Team Login
              </Button>
              <a href={createPageUrl('ClientOrderForm')}>
                <Button className="bg-white text-[#2053E6] hover:bg-gray-100">
                  Order Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/b878ac35a_bg.png)'
          }}
        >
          {/* Overlay for opacity control */}
          <div className="absolute inset-0 bg-[#2053E6] opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Professional Printing & Design Services
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Bring Your Ideas to{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Life
              </span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              From digital printing to creative design and AR experiences, we deliver excellence in every project. 
              Fast turnaround, competitive pricing, and unmatched quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={createPageUrl('ClientOrderForm')}>
                <Button size="lg" className="bg-white text-[#2053E6] hover:bg-gray-100 px-8 py-6 text-lg shadow-xl">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <a href={createPageUrl('ClientQuote')}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm">
                  Get a Quote
                </Button>
              </a>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 justify-center mt-12">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/30"
                >
                  <feature.icon className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
              Our Services
            </Badge>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need, All in One Place
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive printing and design solutions tailored to your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) =>
            <Card
              key={index}
              className="bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:shadow-xl transition-all duration-300 group">

                <CardContent className="p-6">
                  <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    {service.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Place your order now or request a custom quote. Our team is ready to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={createPageUrl('ClientOrderForm')}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
                Place an Order
              </Button>
            </a>
            <a href={createPageUrl('ClientQuote')}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Request a Quote
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Get in Touch
            </Badge>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h3>
            <p className="text-lg text-gray-600">
              Have questions? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Phone</h4>
                <a href="tel:09778270150" className="text-blue-600 hover:underline">
                  0977 827 0150
                </a>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                <a href="mailto:info@mcts.com" className="text-indigo-600 hover:underline">
                  info@mcts.com
                </a>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Visit Us</h4>
                <p className="text-gray-600 text-sm">
                  Your trusted printing partner
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                  alt="MCTS Logo"
                  className="h-8 w-auto"
                />
                <span className="text-white font-bold text-lg">MCTS</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional printing and design solutions for businesses of all sizes.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                    Services
                  </a>
                </li>
                <li>
                  <a href={createPageUrl('ClientOrderForm')} className="text-gray-400 hover:text-white transition-colors">
                    Order Now
                  </a>
                </li>
                <li>
                  <a href={createPageUrl('ClientQuote')} className="text-gray-400 hover:text-white transition-colors">
                    Get a Quote
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">For Team Members</h4>
              <p className="text-gray-400 text-sm mb-4">
                Access the internal management system.
              </p>
              <Button onClick={handleLogin} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                Team Login
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} MCTS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
