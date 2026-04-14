import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Sparkles, Shirt, Layout, Video, ShoppingBag, Users, ArrowRight, Heart, Star, Quote, GemIcon } from "lucide-react";
import { GeminiIcon } from "../components/Sidebar";
import logo from "../assets/logo.png";

interface HomeViewProps {
  userName: string;
  setActiveTab: (tab: string) => void;
}

export const HomeView = ({ userName, setActiveTab }: HomeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const GeminiIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" />
  </svg>
);

  const features = [
    {
      id: "lab",
      title: "AI Style Lab",
      description: "Get personalized AI-powered style recommendations based on your wardrobe.",
      icon: GeminiIcon,
      color: "bg-pink",
      textColor: "text-primary"
    },
    {
      id: "wardrobe",
      title: "Digital Wardrobe",
      description: "Upload and organize your clothes to build your digital collection.",
      icon: Shirt,
      color: "bg-orange",
      textColor: "text-primary"
    },
    {
      id: "styler",
      title: "Outfit Styler",
      description: "Mix and match your items on a collaborative canvas to create perfect looks.",
      icon: Layout,
      color: "bg-cream-support",
      textColor: "text-primary"
    },
    {
      id: "upcycle",
      title: "Upcycle Lab",
      description: "Learn how to transform your old clothes with creative tutorials.",
      icon: Video,
      color: "bg-purple-support",
      textColor: "text-bg"
    },
    {
      id: "market",
      title: "Marketplace",
      description: "Buy and sell pre-loved fashion within the conscious community.",
      icon: ShoppingBag,
      color: "bg-green-support",
      textColor: "text-bg"
    },
    {
      id: "community",
      title: "Community",
      description: "Follow other stylists and share your creative outfits.",
      icon: Users,
      color: "bg-lavender-support",
      textColor: "text-primary"
    }
  ];

  return (
    <div ref={containerRef} className="relative min-h-[300vh] min-x-auto bg-transparent transition-colors duration-300">
      {/* Hero Section with Parallax */}
      <section className="sticky top-0 min-h-screen flex items-center justify-center overflow-hidden z-10 -mt-35">
        <motion.div
          style={{ scale, opacity }}
          className="relative z-10 text-center space-y-1 px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pink/30 text-primary border-primary/10 font-accent text-1xl backdrop-blur-sm"
          >
            Hello, {userName}!
          </motion.div>

          <img
            src={logo}
            alt="Social Thrift Logo"
            className="w-[300px] md:w-[500px] mx-auto drop-shadow-lg"
          />

          <p className="text-2xl text-primary max-w-2xl mx-auto font-medium leading-relaxed">
            Your Style. Your Impact. Your Thrift
          </p>

          <div className="flex justify-center gap-6 pt-4">
            <button
              onClick={() => setActiveTab("lab")}
              className="px-10 py-3 bg-primary text-orange font-alt text-2xl rounded-4xl hover:scale-105 transition-all retro-shadow-dark-primary"
            >
              Start Styling
            </button>
            <button
              onClick={() => setActiveTab("market")}
              className="px-10 py-3 bg-pink text-text font-alt text-2xl rounded-4xl hover:scale-105 transition-all retro-shadow-text"
            >
              Shop Now
            </button>
          </div>
        </motion.div>

        {/* Parallax Background Elements */}
        <motion.div
          style={{ y: y1, rotate }}
          className="absolute top-20 left-10 w-64 h-64 bg-orange/20 rounded-[4rem] blur-3xl -z-10"
        />
        <motion.div
          style={{ y: y2, rotate: -rotate }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink/20 rounded-full blur-3xl -z-10"
        />
      </section>

      {/* Features Section */}
      <section className="relative z-30 bg-transparent rounded-t-[5rem] py-32 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-7xl font-heading text-primary">The Creative Incubator</h2>
              <p className="text-xl text-text font-medium leading-relaxed">
                From fashion novices to style mavens, our platform is designed to spark creativity and foster a vibrant community of thrift enthusiasts. Whether you"re looking to revamp your wardrobe or share your unique style, we"ve got you covered.
              </p>
            </div>
            <div className="font-accent text-2xl text-text -rotate-9 opacity-80">
              Vintage Vibes Only
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveTab(feature.id)}
                className={`group cursor-pointer p-10 rounded-[3.5rem] ${feature.color} ${feature.textColor} transition-all hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-3xl font-heading mb-4">{feature.title}</h3>
                  <p className="text-lg leading-relaxed mb-8 font-body">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-3 font-bold text-sm uppercase tracking-widest">
                    Dive In <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                {/* Decorative background shape */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Aesthetic Quote Section */}
      <section className="relative z-30 h-screen flex items-center justify-center bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bg via-transparent to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-12"
        >
          <Quote className="mx-auto text-pink opacity-20" size={80} />
          <p className="font-complementary italic text-4xl md:text-6xl text-bg leading-tight">
            "Fashion is the most powerful art there is. It"s movement, design, and architecture all in one. It shows the world who we are and who we"d like to be."
          </p>
          <div className="space-y-2">
            <div className="w-20 h-1 bg-orange mx-auto rounded-full" />
            <p className="font-accent text-3xl text-pink">RE:Thriva Philosophy</p>
          </div>
        </motion.div>
      </section>

      {/* Final CTA & Footer */}
      <section className="relative z-30 bg-bg py-32 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary rounded-[4rem] p-12 md:p-24 text-center space-y-8 shadow-2xl">
            <h2 className="text-5xl md:text-8xl font-heading text-bg">Ready to <br /> Transform?</h2>
            <p className="text-2xl text-bg/70 max-w-2xl mx-auto font-body">
              Join thousands of stylists who are making fashion sustainable and fun.
            </p>
            <button
              onClick={() => setActiveTab("lab")}
              className="px-12 py-6 bg-pink text-primary font-heading text-3xl rounded-3xl hover:scale-105 transition-all shadow-2xl shadow-pink/20"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
