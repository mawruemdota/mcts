import React from 'react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { 
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const handleLogin = () => {
    window.location.href = createPageUrl('Login');
  };

  const services = [
    'stickers',
    'tarpaulins', 
    'invitations',
    'calling cards',
    'IDs',
    'shirts',
    'menu boards',
    'lanyards',
    'mugs',
    'photocopies'
  ];

  const packageFeatures = [
    'Quality Prints',
    'Quality Equipment',
    'Free Layout',
    'Fast Turnaround'
  ];

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Poppins', sans-serif;
        }

        .hero-title {
          font-size: clamp(3rem, 10vw, 7rem);
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: -0.02em;
        }

        .section-title {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 900;
          line-height: 1;
        }

        .subtitle {
          font-size: clamp(1.2rem, 3vw, 1.8rem);
          font-weight: 600;
        }

        .electric-blue {
          background-color: #1A64F1;
        }

        .light-blue {
          background-color: #D7E6FF;
          color: #1A64F1;
        }

        .yellow-accent {
          background-color: #FFD749;
          color: #1A64F1;
        }

        .white-box {
          background: white;
          border-radius: 24px;
          padding: 1.5rem 2.5rem;
          display: inline-block;
        }

        .service-item {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 800;
          line-height: 1.2;
        }

        .icon-graphic {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .white-box {
            padding: 1rem 1.5rem;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="electric-blue sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                alt="MCTS Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-black text-white">MCTS</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleLogin} 
                variant="ghost" 
                className="text-white hover:bg-white/20 font-bold hidden md:block"
              >
                Team Login
              </Button>
              <a href={createPageUrl('ClientOrderForm')}>
                <Button className="bg-white text-[#1A64F1] hover:bg-[#D7E6FF] font-bold text-lg px-6">
                  Order Na!
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="electric-blue text-white py-16 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-8">
            <h2 className="hero-title mb-4">
              <span className="block">your creative</span>
              <span className="block">partner</span>
            </h2>
            <p className="subtitle text-white/90 max-w-3xl mx-auto">
              mula sa print hanggang design, kami na bahala!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a href={createPageUrl('ClientOrderForm')}>
              <Button size="lg" className="bg-white text-[#1A64F1] hover:bg-[#D7E6FF] font-bold text-xl px-10 py-7 rounded-2xl">
                Mag-order Agad
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </a>
            <a href={createPageUrl('ClientQuote')}>
              <Button size="lg" variant="outline" className="border-4 border-white text-white hover:bg-white hover:text-[#1A64F1] font-bold text-xl px-10 py-7 rounded-2xl">
                Magpa-quote Muna
              </Button>
            </a>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center">
            {packageFeatures.map((feature, index) => (
              <div key={index} className="white-box">
                <span className="font-bold text-[#1A64F1] flex items-center gap-2 text-lg">
                  <CheckCircle className="w-6 h-6" />
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Package Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block light-blue px-6 py-2 rounded-full mb-4">
                <span className="font-bold">PATOK NA PACKAGE!</span>
              </div>
              <h3 className="section-title text-[#1A64F1] mb-4">
                business<br/>package
              </h3>
              <p className="subtitle text-gray-700 mb-6">
                let's build your brand!
              </p>
              <div className="inline-block bg-[#1A64F1] text-white px-8 py-6 rounded-3xl mb-8">
                <div className="text-sm font-semibold mb-1">price starts at</div>
                <div className="text-6xl font-black">₱1,000<span className="text-3xl">.00</span></div>
              </div>
              <div className="light-blue p-6 rounded-3xl">
                <h4 className="text-2xl font-black mb-2">customizable order</h4>
                <p className="font-semibold">piliin natin ano lang kailangan mo</p>
              </div>
            </div>

            <div>
              <div className="light-blue p-8 rounded-3xl">
                <h4 className="text-2xl font-black mb-6">gawa tayo ng:</h4>
                <ul className="space-y-3">
                  {services.map((service, index) => (
                    <li key={index} className="service-item flex items-center">
                      <span className="text-[#1A64F1] mr-3">•</span>
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="electric-blue text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="section-title mb-4">
              ano pa ba<br/>kaya namin?
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Branding & Design */}
            <div className="bg-white text-[#1A64F1] rounded-3xl p-8">
              <div className="inline-block yellow-accent px-6 py-2 rounded-full mb-6">
                <span className="font-black text-lg">UP TO 50% OFF!</span>
              </div>
              <h4 className="text-4xl font-black mb-3">
                branding<br/>& design
              </h4>
              <p className="text-xl font-bold mb-6">turn your ideas to impact!</p>
              <p className="text-lg font-semibold">at marami pang iba!</p>
            </div>

            {/* Photobooth */}
            <div className="bg-white text-[#1A64F1] rounded-3xl p-8">
              <h4 className="text-3xl font-black mb-3">
                avail our<br/>photobooth
              </h4>
              <p className="text-lg font-bold mb-4">
                sama namin ang customized games
              </p>
              <div className="inline-block yellow-accent px-6 py-3 rounded-full">
                <span className="font-black text-2xl">50% off!</span>
              </div>
              <p className="text-sm font-semibold mt-6">Price starts at ₱3,500 for 2 hours unlimited session</p>
            </div>

            {/* Rush Orders */}
            <div className="bg-white text-[#1A64F1] rounded-3xl p-8">
              <h4 className="text-3xl font-black mb-3">
                rush orders?
              </h4>
              <p className="text-2xl font-black mb-4">
                laban yan!
              </p>
              <p className="text-lg font-bold">
                wag lang instant ha 😅
              </p>
              <div className="mt-6 light-blue p-4 rounded-2xl">
                <p className="font-bold text-sm">we accept rush orders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Order Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="section-title text-[#1A64F1] mb-8">
            hmmm<br/>
            <span className="text-gray-300">pano?</span>
          </h3>
          <p className="subtitle text-[#1A64F1] mb-12">how to order</p>

          <div className="light-blue p-10 rounded-3xl mb-8">
            <h4 className="text-3xl font-black text-[#1A64F1] mb-4">pano nga</h4>
            <p className="text-5xl font-black text-[#1A64F1]">
              magmessage sa page<br/>for inquiry
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <a href={createPageUrl('ClientOrderForm')} className="block">
              <div className="electric-blue p-8 rounded-3xl hover:scale-105 transition-transform cursor-pointer">
                <p className="text-white text-2xl font-black">
                  Click here para<br/>mag-order online! 
                </p>
              </div>
            </a>
            <a href={createPageUrl('ClientQuote')} className="block">
              <div className="electric-blue p-8 rounded-3xl hover:scale-105 transition-transform cursor-pointer">
                <p className="text-white text-2xl font-black">
                  Click here para<br/>magpa-quote! 
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="electric-blue text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-6xl font-black mb-6">
            Lika na,<br/>
            <span className="text-[#FFD749]">Message</span> mo na kami!
          </h3>
          <p className="text-2xl font-bold mb-10">
            DI kami nangangagat, promise! 😊
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href={createPageUrl('ClientOrderForm')}>
              <Button size="lg" className="bg-white text-[#1A64F1] hover:bg-[#D7E6FF] font-bold text-2xl px-12 py-8 rounded-2xl w-full sm:w-auto">
                Order Na Kasi!
              </Button>
            </a>
            <a href="tel:09778270150">
              <Button size="lg" className="bg-[#FFD749] text-[#1A64F1] hover:bg-[#FFD749]/90 font-bold text-2xl px-12 py-8 rounded-2xl w-full sm:w-auto">
                <Phone className="w-6 h-6 mr-3" />
                Tawag Na!
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="light-blue p-8 rounded-3xl text-center">
              <div className="icon-graphic mx-auto mb-4">
                <Phone className="w-10 h-10 text-[#1A64F1]" />
              </div>
              <h4 className="text-xl font-black text-[#1A64F1] mb-2">Tawag Lang!</h4>
              <a href="tel:09778270150" className="text-2xl font-bold text-[#1A64F1] hover:underline">
                0977 827 0150
              </a>
            </div>

            <div className="light-blue p-8 rounded-3xl text-center">
              <div className="icon-graphic mx-auto mb-4">
                <Mail className="w-10 h-10 text-[#1A64F1]" />
              </div>
              <h4 className="text-xl font-black text-[#1A64F1] mb-2">Email Us!</h4>
              <a href="mailto:info@mcts.com" className="text-2xl font-bold text-[#1A64F1] hover:underline">
                info@mcts.com
              </a>
            </div>

            <div className="light-blue p-8 rounded-3xl text-center">
              <div className="icon-graphic mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-[#1A64F1]" />
              </div>
              <h4 className="text-xl font-black text-[#1A64F1] mb-2">Message Mo!</h4>
              <p className="text-lg font-bold text-[#1A64F1]">
                Your trusted printing partner
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="electric-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                  alt="MCTS Logo"
                  className="h-12 w-auto"
                />
                <span className="text-3xl font-black">MCTS</span>
              </div>
              <p className="text-lg font-semibold">
                Your creative partner sa lahat ng printing at design needs!
              </p>
            </div>

            <div>
              <h4 className="text-2xl font-black mb-4">Quick Links</h4>
              <ul className="space-y-2 text-lg font-semibold">
                <li>
                  <a href={createPageUrl('ClientOrderForm')} className="hover:text-[#FFD749] transition-colors">
                    Order Na
                  </a>
                </li>
                <li>
                  <a href={createPageUrl('ClientQuote')} className="hover:text-[#FFD749] transition-colors">
                    Magpa-Quote
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-2xl font-black mb-4">Para sa Team</h4>
              <p className="text-lg font-semibold mb-4">
                Access the internal system
              </p>
              <Button 
                onClick={handleLogin} 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-[#1A64F1] font-bold rounded-xl"
              >
                Team Login
              </Button>
            </div>
          </div>

          <div className="border-t border-white/30 pt-8 text-center">
            <p className="text-lg font-semibold">&copy; {new Date().getFullYear()} MCTS. Gawa namin 'to with 💙</p>
          </div>
        </div>
      </footer>
    </div>
  );
}