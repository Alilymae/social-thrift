//aight starting
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Sparkles, Shirt, Layout, Video, ShoppingBag, Users, ArrowRight, Heart, Star, Quote, GemIcon } from "lucide-react";
import logoLight from "../assets/logo-2.png";
import logoDark from "../assets/logo-1.png";
import sparkleLight1 from "../assets/sp-1.png";
import sparkleLight2 from "../assets/sp-2.png";
import "../index.css";

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
  const rotate = useTransform(scrollYProgress, [0, 2], [0, 90]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  //gemini icon
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

  //features for the grid sec
  const features = [
    {
      id: "lab",
      title: "AI Style Lab",
      description: "Get personalized AI-powered style recommendations based on your wardrobe.",
      icon: GeminiIcon,
      className: "font-medium bg-pink text-dark border-dark dark:bg-dark-green dark:text-pink dark:border-pink [&_h3]:text-inherit",
      iconClassNameName: "text-dark dark:text-pink",
    },
    {
      id: "wardrobe",
      title: "Digital Wardrobe",
      description: "Upload and organize your clothes to build your digital collection.",
      icon: Shirt,
      className: " font-medium bg-yellow-support text-primary border-primary [&_h3]:text-inherit dark:bg-orange dark:text-dark dark:border-cream",
    },
    {
      id: "styler",
      title: "Outfit Styler",
      description: "Mix and match your items on a collaborative canvas to create perfect looks.",
      icon: Layout,
      className: "bg-cream-support text-dark font-medium border-dark dark:bg-dark dark:text-lavender-support [&_h3]:text-inherit dark:border-cream-support",
    },
    {
      id: "upcycle",
      title: "Upcycle Lab",
      description: "Learn how to transform your old clothes with creative tutorials.",
      icon: Video,
      className: "[&_h3]:text-inherit font-medium bg-[#EDBD95] text-dark-green border-dark-green dark:bg-[#AC3B61] dark:text-[#FFD7E1] dark:border-[#E4FAE1]",
    },
    {
      id: "market",
      title: "Marketplace",
      description: "Buy and sell pre-loved fashion within the conscious community.",
      icon: ShoppingBag,
      className: "bg-light-green text-dark-green border-dark-green dark:bg-green-support dark:text-[#FBF6EE] dark:border-[#FBF6EE] font-medium [&_h3]:text-inherit",
    },
    {
      id: "community",
      title: "Community",
      description: "Follow other stylists and share your creative outfits.",
      icon: Users,
      className: "bg-[#E9E3FF] text-[#3B3346] border-dark dark:bg-[#8D77AB] dark:text-[#000000] dark:border-[#E9E3FF] font-medium [&_h3]:text-inherit",
    },
  ];

  return (
    <div ref={containerRef} className="relative min-h-[300vh] min-x-auto bg-transparent transition-colors duration-300">
      {/* hero section with parallax scroll yey */}
      <section className="sticky top-0 min-h-screen flex items-center justify-center overflow-hidden z-10 -mt-35">
        <motion.div
          style={{ scale, opacity }}
          className="relative z-10 text-center space-y-1 px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pink/30 text-primary border border-primary/50 font-accent text-1xl backdrop-blur-sm dark:text-yellow-support"
          >
            {/* add a sparkle here but not the lucide onw */}
            Hello, {userName}!
          </motion.div>

          {/* light mode logo */}
          <img
            src={logoLight}
            alt="Social Thrift Logo"
            className="w-[300px] md:w-[500px] mx-auto drop-shadow-lg dark:hidden"
          />

          {/* dark mode logo */}
          <img
            src={logoDark}
            alt="Social Thrift Logo"
            className="w-[300px] md:w-[500px] mx-auto drop-shadow-lg hidden dark:block"
          />

          <p className="text-2xl text-primary max-w-2xl mx-auto font-medium leading-relaxed dark:text-yellow-support">
            Your Style. Your Impact. Your Thrift
          </p>

          <div className="flex justify-center gap-6 pt-4">
            <button
              onClick={() => setActiveTab("lab")}
              className="px-10 py-3 bg-yellow-support text-dark-green font-alt text-2xl rounded-4xl hover:scale-105 transition-all retro-shadow-primary dark:text-primary dark:bg-dark-green"
            >
              Start Styling
            </button>
            <button
              onClick={() => setActiveTab("market")}
              className="px-10 py-3 bg-pink text-text font-alt text-2xl rounded-4xl hover:scale-105 transition-all retro-shadow-text dark:text-cream dark:bg-dark"
            >
              Shop Now
            </button>
          </div>
        </motion.div>

        {/* parallax background elemnets */}
        <motion.div
          style={{ y: y1, rotate, scale, opacity }}
          className="absolute w-full h-full -z-10"
        >
          {/* big */}
          <img
            src={sparkleLight2}
            alt=""
            className="w-40 h-auto object-cover absolute top-30 left-20 rotate-10"
          />
          {/* small */}
          <img
            src={sparkleLight1}
            alt=""
            className="w-20 h-auto object-cover absolute bottom-30 left-50 rotate-20"
          />
          {/* tiny */}
          <img
            src={sparkleLight1}
            alt=""
            className="w-10 h-auto object-cover absolute top-15 left-90 rotate-20"
          />
          <motion.div
            style={{ y: y2, rotate: -rotate }}
            className="absolute w-full h-full -z-10"
          >
            {/* big */}
            <img
              src={sparkleLight1}
              alt=""
              className="w-40 h-auto object-cover absolute bottom-40 left-230"
            />
            {/* small */}
            <img
              src={sparkleLight1}
              alt=""
              className="w-20 h-auto object-cover absolute top-10 right-50 rotate-20"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* features section */}
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

          {/* card grid section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveTab(feature.id)}
                className={`
                  group cursor-pointer p-10 rounded-[3.5rem] border-2
                  ${feature.className}
                  transition-all hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden
                `}
              >
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                    <feature.icon size={32} className={feature.iconClassNameName} />
                  </div>
                  <h3 className="text-3xl font-heading mb-4">{feature.title}</h3>
                  <p className="text-lg leading-relaxed mb-8 font-body">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-3 font-bold text-sm uppercase tracking-widest">
                    Dive In <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* anna wintour quote */}
      <section className="relative z-30 h-screen flex items-center justify-center bg-primary overflow-hidden dark:bg-pink">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bg via-transparent to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-12"
        >
          <Quote className="mx-auto text-pink dark:text-dark-green" size={80} />
          <p className="font-complementary italic text-4xl md:text-6xl text-bg leading-tight" dark:text-dark>
            “Create your own style… let it be unique for yourself and yet identifiable for others.”
          </p>
          <div className="space-y-2">
            <div className="w-20 h-1 bg-orange mx-auto rounded-full dark:bg-dark-green" />
            <p className="font-alt text-3xl text-pink py-6 dark:text-dark">RE:Thriva Philosophy</p>
          </div>
        </motion.div>
      </section>

      {/* final extra then footer */}
      <section className="relative z-30 py-32 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="bg-cream-support rounded-[4rem] border-[#3B3346] border-2 p-12 md:p-24 text-center space-y-8 shadow-2xl dark:bg-purple-support dark:border-[#E9E3FF]">
            <h2 className="text-5xl md:text-8xl font-heading text-[#3B3346] dark:text-[#E9E3FF]">Ready to <br /> Transform?</h2>
            <p className="text-2xl text-dark max-w-2xl mx-auto font-body dark:text-[#E9E3FF]">
              Join thousands of stylists who are making fashion sustainable and fun.
            </p>
            <button
              onClick={() => setActiveTab("lab")}
              className="px-12 py-6 bg-lavender-support text-dark font-heading text-3xl rounded-full hover:scale-105 transition-all shadow-2xl shadow-dark/20 dark:bg-[#3B3346] dark:text-cream-support"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
// working time: 7:52:08 vs code >:'(