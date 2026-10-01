const fs = require('fs');
let content = fs.readFileSync('Navbar.js', 'utf8');

const newBadge1 = 
                      {/* Account Badge */}
                      {isSubscribedUser ? (
                        <div className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700]/10 via-[#F59E0B]/10 to-transparent border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.15)] select-none shrink-0" title="Premium Subscriber">
                          <FiAward className="text-[#FFD700]" size={14} />
                          <span className="text-[11px] font-black text-[#FFD700] tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">PRO</span>
                        </div>
                      ) : (
                        <div className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0D1117]/60 border border-[#34E38A]/30 shadow-inner select-none shrink-0" title="Free Trial User">
                          <FiZap className="text-[#34E38A]" size={14} />
                          <span className="text-[11px] font-bold text-[#34E38A] tracking-widest uppercase">FREE TIER</span>
                        </div>
                      )}
;

content = content.replace(/\{\/\* Account Badge \*\/\}[\s\S]*?\{\/\* Account Badge \*\//, newBadge1 + '\n                      {/* Account Badge */');

fs.writeFileSync('Navbar.js', content, 'utf8');
