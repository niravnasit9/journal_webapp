"use client";

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-[#050608]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">touch</span>.
          </h2>
          <p className="text-muted-foreground text-lg">
            Have questions about our enterprise plans, need support, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">First Name</label>
                <input 
                  type="text" 
                  placeholder="John" 
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe" 
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Message</label>
              <textarea 
                rows={5} 
                placeholder="How can we help you?" 
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              ></textarea>
            </div>
            
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
