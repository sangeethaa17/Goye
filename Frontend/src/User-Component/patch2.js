const fs = require('fs');
let content = fs.readFileSync('Navbar.js', 'utf8');

const newBadge =                       {/* Account Badge */}
                      {isSubscribedUser ? (
                        <div className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700]/10 via-[#F59E0B]/10 to-transparent border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.15)] select-none shrink-0" title="Premium Subscriber">
                          <FiAward className="text-[#FFD700]" size={14} />
                          <span className="text-[11px] font-black text-[#FFD700] tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">PRO</span>
                        </div>
                      ) : (
                        <div className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0D1117]/60 border border-[#34E38A]/30 shadow-inner select-none shrink-0" title="Free Tier">
                          <FiZap className="text-[#34E38A]" size={14} />
                          <span className="text-[11px] font-bold text-[#34E38A] tracking-widest uppercase">FREE TIER</span>
                        </div>
                      )};

let parts = content.split('{/* Account Badge */}');
if (parts.length >= 3) {
    // parts[0] is everything before first badge
    // parts[1] is the first badge
    // parts[2] is the second badge
    // Find where the first badge ends: )} followed by <button
    let firstBadgeEnd = parts[1].indexOf(')}');
    let firstBadgeTail = parts[1].substring(firstBadgeEnd + 2);
    
    let secondBadgeEnd = parts[2].indexOf(')}');
    let secondBadgeTail = parts[2].substring(secondBadgeEnd + 2);
    
    // The badge code itself without the comment header
    let badgeCode = newBadge.replace('                      {/* Account Badge */}\\n', '');
    
    content = parts[0] + newBadge + firstBadgeTail + newBadge + secondBadgeTail + (parts.slice(3).join('{/* Account Badge */}'));
    fs.writeFileSync('Navbar.js', content, 'utf8');
    console.log('Success');
} else {
    console.log('Failed to find split points');
}
