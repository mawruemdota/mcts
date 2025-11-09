
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import OptimizedImage from '@/components/ui/OptimizedImage';
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
  Image as ImageIcon,
  Facebook,
  Instagram
} from 'lucide-react';

export default function HomePage() {
  const services = [
    {
      icon: Printer,
      title: 'Digital Printing',
      description: 'High-quality tarpaulins, stickers, banners, and large format printing for all your business needs.',
      color: 'bg-blue-500',
      backgroundImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/4421b8bd3_ElyuInasal.jpg'
    },
    {
      icon: FileText,
      title: 'Business Cards & IDs',
      description: 'Professional business cards, calling cards, and employee ID printing with quick turnaround.',
      color: 'bg-green-500',
      backgroundImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/9c22c69df_1.png'
    },
    {
      icon: ImageIcon,
      title: 'Promotional Materials',
      description: 'Eye-catching flyers, brochures, invitations, and marketing materials to boost your brand.',
      color: 'bg-purple-500',
      backgroundImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/2216363cc_IMG_9573.jpg'
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
              <OptimizedImage
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/7aad79b47_logo3.png"
                alt="MCTS Logo"
                className="h-14 w-auto"
                priority={true}
              />
              <h1 className="text-2xl font-bold text-white">MCTS</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="#services" className="text-white/90 font-bold hover:text-white transition-colors hidden md:block">Services</a>
              <a href="#contact" className="text-white/90 font-bold hover:text-white transition-colors hidden md:block">Contact</a>
              <a href={createPageUrl('ClientOrderForm')}>
                <Button className="bg-white text-[#2053E6] hover:bg-gray-100">
                  Order
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/b878ac35a_bg.png"
            alt="Background"
            className="w-full h-full"
            objectFit="cover"
            priority={true}
          />
          {/* Overlay for opacity control */}
          <div className="absolute inset-0 bg-[#2053E6] opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-white mb-6 text-4xl font-black lowercase sm:text-5xl lg:text-6xl">Bring Your Ideas to Impact</h2>
            <p className="text-xl text-white/90 mb-8">
              From creative design to printable outputs, kami ang bahala sa inyo!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={createPageUrl('ClientOrderForm')}>
                <Button size="lg" className="bg-white text-[#2053E6] hover:bg-gray-100 px-8 py-6 text-lg shadow-xl">
                  Order <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 justify-center mt-12">
              {features.map((feature, index) =>
                <div
                  key={index} className="bg-slate-800 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm shadow-sm border border-white/30">


                  <feature.icon className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">{feature.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <OptimizedImage
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/ad1abef0a_pattern2.png"
            alt="Pattern"
            className="w-full h-full"
            objectFit="repeat"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
              Our Services
            </Badge>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Designed to help you with your creative needs
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">basta creative execution, pagusapan natin</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) =>
              <Card
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:shadow-xl transition-all duration-300 group overflow-hidden">

                <CardContent className="bg-[#2053E6] p-6 relative min-h-[200px]">
                  {/* Background Image with Opacity */}
                  {service.backgroundImage && (
                    <div className="absolute inset-0 opacity-30">
                      <OptimizedImage
                        src={service.backgroundImage}
                        alt={service.title}
                        className="w-full h-full"
                        objectFit="cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative z-10">
                    {!service.backgroundImage && (
                      <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h4 className="text-slate-100 mb-3 text-xl font-black text-left lowercase mt-4">
                      {service.title}
                    </h4>
                    <p className="text-slate-50 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-white mb-6 text-3xl font-black sm:text-4xl">let's make an impact!</h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Place your order now and our team will contact you to finalize the details and bring your vision to life.
          </p>
          <a href={createPageUrl('ClientOrderForm')}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
              Order
            </Button>
          </a>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white relative">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
        >
          <OptimizedImage
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/ad1abef0a_pattern2.png"
            alt="Contact Pattern"
            className="w-full h-full"
            objectFit="repeat"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Get in Touch
            </Badge>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">we got you!</h3>
            <p className="text-lg text-gray-600">
              Have questions? We're here to help.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Phone */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href="tel:09778270150" className="text-gray-900 font-medium hover:text-blue-600 transition-colors">
                        0977 827 0150
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href="mailto:marasigancts@gmail.com" className="text-gray-900 font-medium hover:text-indigo-600 transition-colors">
                        marasigancts@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-gray-900 font-medium">Dasmarinas, Cavite</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Social Media */}
                  <div>
                    <p className="text-sm text-gray-500 mb-3">Follow Us</p>
                    <div className="flex items-center gap-3">
                      <a
                        href="https://facebook.com/marasigancts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Facebook</span>
                      </a>
                      <a
                        href="https://www.instagram.com/marasigancts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-pink-600" />
                        <span className="text-sm font-medium text-gray-900">Instagram</span>
                      </a>
                    </div>
                  </div>
                </div>
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
                <OptimizedImage
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/7aad79b47_logo3.png"
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
                    Place Your Order
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
              <a href={createPageUrl('Dashboard')}>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Go to Dashboard
                </Button>
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} MCTS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);

}
