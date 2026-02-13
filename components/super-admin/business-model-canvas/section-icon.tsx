import {
  Handshake, Gift, Heart, Users, Truck, Wallet, TrendingUp, Target, Briefcase,
} from "lucide-react"

export function SectionIcon({ name, className }: { name?: string; className?: string }) {
  switch (name) {
    case "Handshake": return <Handshake className={className} />
    case "Briefcase": return <Briefcase className={className} />
    case "Gift": return <Gift className={className} />
    case "Heart": return <Heart className={className} />
    case "Users": return <Users className={className} />
    case "Truck": return <Truck className={className} />
    case "Wallet": return <Wallet className={className} />
    case "TrendingUp": return <TrendingUp className={className} />
    default: return <Target className={className} />
  }
}
