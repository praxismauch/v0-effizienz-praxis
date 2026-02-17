"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Users,
  Globe,
  Star,
  Building2,
  Target,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Phone,
  ExternalLink,
  ThumbsUp,
  Facebook,
  Instagram,
  Linkedin,
  Shield,
} from "lucide-react"

// --- Shared helpers ---

export function getThreatLevelColor(level: string) {
  switch (level?.toLowerCase()) {
    case "hoch": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "mittel": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "niedrig": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    default: return "bg-gray-100 text-gray-800"
  }
}

export function getPriorityColor(priority: string) {
  return getThreatLevelColor(priority)
}

export function StarRating({ rating, maxStars = 5 }: { rating: number; maxStars?: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0)
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => <Star key={`f-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
      {hasHalfStar && <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => <Star key={`e-${i}`} className="h-4 w-4 text-gray-300" />)}
    </div>
  )
}

export function JamedaRating({ rating }: { rating: number }) {
  const getColor = () => {
    if (rating <= 1.5) return "text-green-600 bg-green-100"
    if (rating <= 2.5) return "text-lime-600 bg-lime-100"
    if (rating <= 3.5) return "text-yellow-600 bg-yellow-100"
    if (rating <= 4.5) return "text-orange-600 bg-orange-100"
    return "text-red-600 bg-red-100"
  }
  return <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getColor()}`}>{rating.toFixed(1)}</span>
}

export function RatingDistribution({ distribution }: { distribution: any }) {
  if (!distribution) return null
  const total = (distribution["5_star"] || 0) + (distribution["4_star"] || 0) + (distribution["3_star"] || 0) + (distribution["2_star"] || 0) + (distribution["1_star"] || 0)
  if (total === 0) return null
  const bars = [
    { stars: 5, count: distribution["5_star"] || 0, color: "bg-green-500" },
    { stars: 4, count: distribution["4_star"] || 0, color: "bg-lime-500" },
    { stars: 3, count: distribution["3_star"] || 0, color: "bg-yellow-500" },
    { stars: 2, count: distribution["2_star"] || 0, color: "bg-orange-500" },
    { stars: 1, count: distribution["1_star"] || 0, color: "bg-red-500" },
  ]
  return (
    <div className="space-y-1">
      {bars.map((bar) => (
        <div key={bar.stars} className="flex items-center gap-2 text-xs">
          <span className="w-3">{bar.stars}</span>
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${bar.color}`} style={{ width: `${(bar.count / total) * 100}%` }} />
          </div>
          <span className="w-8 text-right text-muted-foreground">{bar.count}</span>
        </div>
      ))}
    </div>
  )
}

// --- Tab: Overview ---

export function OverviewTab({ analysis }: { analysis: any }) {
  const ratingSummary = analysis.ai_analysis?.ratings_summary
  return (
    <div className="space-y-4">
      {analysis.summary && (
        <Card>
          <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p></CardContent>
        </Card>
      )}
      {analysis.market_overview && (
        <Card>
          <CardHeader><CardTitle>Marktübersicht</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {analysis.market_overview.market_size && <div><h4 className="font-medium mb-1">Marktgröße</h4><p className="text-sm text-muted-foreground">{analysis.market_overview.market_size}</p></div>}
            {analysis.market_overview.demographics && <div><h4 className="font-medium mb-1">Demografie</h4><p className="text-sm text-muted-foreground">{analysis.market_overview.demographics}</p></div>}
            {analysis.market_overview.trends?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Markttrends</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.market_overview.trends.map((trend: string, i: number) => <Badge key={i} variant="secondary"><TrendingUp className="h-3 w-3 mr-1" />{trend}</Badge>)}
                </div>
              </div>
            )}
            {analysis.market_overview.growth_potential && <div><h4 className="font-medium mb-1">Wachstumspotenzial</h4><p className="text-sm text-muted-foreground">{analysis.market_overview.growth_potential}</p></div>}
          </CardContent>
        </Card>
      )}
      {ratingSummary && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Bewertungsübersicht im Markt</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1"><Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /><span className="text-2xl font-bold">{ratingSummary.average_google_rating?.toFixed(1) || "-"}</span></div>
                <p className="text-sm text-muted-foreground">O Google Rating</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg"><div className="text-2xl font-bold text-green-600 mb-1">{ratingSummary.average_jameda_rating?.toFixed(1) || "-"}</div><p className="text-sm text-muted-foreground">O Jameda Note</p></div>
              <div className="text-center p-4 bg-muted rounded-lg"><div className="text-2xl font-bold mb-1">{ratingSummary.total_reviews_in_market || 0}</div><p className="text-sm text-muted-foreground">Bewertungen gesamt</p></div>
              <div className="text-center p-4 bg-muted rounded-lg"><div className="text-2xl font-bold mb-1">{ratingSummary.review_response_rate || "0%"}</div><p className="text-sm text-muted-foreground">Antwortrate</p></div>
            </div>
            {ratingSummary.key_review_insights?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Wichtige Erkenntnisse</h4>
                <ul className="space-y-1">{ratingSummary.key_review_insights.map((insight: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />{insight}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Tab: Competitors ---

export function CompetitorsTab({ analysis }: { analysis: any }) {
  if (!analysis.competitors?.length) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Keine Konkurrenten analysiert</CardContent></Card>
  }
  return (
    <div className="space-y-4">
      {analysis.competitors.map((competitor: any, index: number) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{competitor.name}</CardTitle>
                <CardDescription className="flex items-center gap-2"><MapPin className="h-3 w-3" />{competitor.address}{competitor.distance_km && <span className="text-xs">({competitor.distance_km} km)</span>}</CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {competitor.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{competitor.phone}</span>}
                  {competitor.website && <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />Website</a>}
                </div>
              </div>
              <Badge className={getThreatLevelColor(competitor.threat_level)}>{competitor.threat_level} Bedrohung</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              {competitor.google_rating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white rounded flex items-center justify-center"><span className="text-xs font-bold text-blue-600">G</span></div><span className="font-medium text-sm">Google</span></div>
                  <div className="flex items-center gap-2"><StarRating rating={competitor.google_rating.rating} /><span className="font-semibold">{competitor.google_rating.rating?.toFixed(1)}</span><span className="text-sm text-muted-foreground">({competitor.google_rating.review_count})</span></div>
                  {competitor.google_rating.recent_trend && <div className="flex items-center gap-1 text-xs">{competitor.google_rating.recent_trend === "steigend" ? <TrendingUp className="h-3 w-3 text-green-500" /> : competitor.google_rating.recent_trend === "fallend" ? <TrendingDown className="h-3 w-3 text-red-500" /> : <span className="h-3 w-3">{'\u2192'}</span>}<span className="text-muted-foreground">Trend: {competitor.google_rating.recent_trend}</span></div>}
                  {competitor.google_rating.rating_distribution && <div className="mt-2"><RatingDistribution distribution={competitor.google_rating.rating_distribution} /></div>}
                </div>
              )}
              {competitor.jameda_rating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center"><span className="text-xs font-bold text-white">J</span></div><span className="font-medium text-sm">Jameda</span></div>
                  <div className="flex items-center gap-2"><JamedaRating rating={competitor.jameda_rating.rating} /><span className="text-sm text-muted-foreground">({competitor.jameda_rating.review_count})</span></div>
                  {competitor.jameda_rating.recommendation_rate && <div className="flex items-center gap-1 text-xs text-muted-foreground"><ThumbsUp className="h-3 w-3 text-green-500" />{competitor.jameda_rating.recommendation_rate}</div>}
                </div>
              )}
              {competitor.sanego_rating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center"><span className="text-xs font-bold text-white">S</span></div><span className="font-medium text-sm">Sanego</span></div>
                  <div className="flex items-center gap-2"><StarRating rating={competitor.sanego_rating.rating} /><span className="font-semibold">{competitor.sanego_rating.rating?.toFixed(1)}</span><span className="text-sm text-muted-foreground">({competitor.sanego_rating.review_count})</span></div>
                </div>
              )}
            </div>
            {competitor.online_presence_score !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">Online-Prasenz Score</span><span className="text-sm font-bold">{competitor.online_presence_score}/100</span></div>
                <Progress value={competitor.online_presence_score} className="h-2" />
              </div>
            )}
            {competitor.social_media && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Social Media:</span>
                {competitor.social_media.facebook && <Facebook className="h-4 w-4 text-blue-600" />}
                {competitor.social_media.instagram && <Instagram className="h-4 w-4 text-pink-600" />}
                {competitor.social_media.linkedin && <Linkedin className="h-4 w-4 text-blue-700" />}
                {!competitor.social_media.facebook && !competitor.social_media.instagram && !competitor.social_media.linkedin && <span className="text-sm text-muted-foreground">Keine aktiven Profile</span>}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div><h4 className="font-medium mb-2 text-green-600">Starken</h4><ul className="text-sm space-y-1">{competitor.strengths?.map((s: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-green-500">+</span> {s}</li>)}</ul></div>
              <div><h4 className="font-medium mb-2 text-red-600">Schwachen</h4><ul className="text-sm space-y-1">{competitor.weaknesses?.map((w: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-red-500">-</span> {w}</li>)}</ul></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
              {competitor.website_quality && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-blue-500" /><span className="text-sm">Website: {competitor.website_quality}</span></div>}
              {competitor.estimated_patient_volume && <div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-500" /><span className="text-sm">{competitor.estimated_patient_volume}</span></div>}
            </div>
            {competitor.unique_selling_points?.length > 0 && (
              <div className="pt-2"><h4 className="font-medium mb-2">Alleinstellungsmerkmale</h4><div className="flex flex-wrap gap-2">{competitor.unique_selling_points.map((usp: string, i: number) => <Badge key={i} variant="outline">{usp}</Badge>)}</div></div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Tab: Ratings ---

export function RatingsTab({ analysis }: { analysis: any }) {
  const ratingSummary = analysis.ai_analysis?.ratings_summary
  return (
    <div className="space-y-4">
      {ratingSummary && (
        <Card>
          <CardHeader><CardTitle>Markt-Bewertungsübersicht</CardTitle><CardDescription>Zusammenfassung aller Bewertungen</CardDescription></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center"><div className="flex items-center justify-center gap-1 mb-2"><Star className="h-6 w-6 fill-yellow-400 text-yellow-400" /><span className="text-3xl font-bold">{ratingSummary.average_google_rating?.toFixed(1) || "-"}</span></div><p className="text-sm font-medium">Durchschnitt Google</p><p className="text-xs text-muted-foreground">im Marktumfeld</p></div>
              <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold text-green-600 mb-2">{ratingSummary.average_jameda_rating?.toFixed(1) || "-"}</div><p className="text-sm font-medium">Durchschnitt Jameda</p><p className="text-xs text-muted-foreground">Note (1.0 = beste)</p></div>
              <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold mb-2">{ratingSummary.total_reviews_in_market || 0}</div><p className="text-sm font-medium">Bewertungen gesamt</p><p className="text-xs text-muted-foreground">alle Plattformen</p></div>
              <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold text-primary mb-2">{ratingSummary.review_response_rate || "0%"}</div><p className="text-sm font-medium">Antwortrate</p><p className="text-xs text-muted-foreground">auf Bewertungen</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Bewertungsvergleich der Konkurrenten</CardTitle><CardDescription>Sortiert nach Google-Bewertung</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.competitors?.slice().sort((a: any, b: any) => (b.google_rating?.rating || 0) - (a.google_rating?.rating || 0)).map((competitor: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full font-bold">{index + 1}</div>
                <div className="flex-1 min-w-0"><h4 className="font-medium truncate">{competitor.name}</h4><p className="text-sm text-muted-foreground truncate">{competitor.address}</p></div>
                <div className="flex items-center gap-6">
                  <div className="text-center"><div className="flex items-center gap-1"><div className="w-5 h-5 bg-white rounded flex items-center justify-center"><span className="text-[10px] font-bold text-blue-600">G</span></div><span className="font-semibold">{competitor.google_rating?.rating?.toFixed(1) || "-"}</span></div><p className="text-xs text-muted-foreground">{competitor.google_rating?.review_count || 0}</p></div>
                  <div className="text-center"><div className="flex items-center gap-1"><div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center"><span className="text-[10px] font-bold text-white">J</span></div><span className="font-semibold">{competitor.jameda_rating?.rating?.toFixed(1) || "-"}</span></div><p className="text-xs text-muted-foreground">{competitor.jameda_rating?.review_count || 0}</p></div>
                  <div className="text-center"><div className="flex items-center gap-1"><div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center"><span className="text-[10px] font-bold text-white">S</span></div><span className="font-semibold">{competitor.sanego_rating?.rating?.toFixed(1) || "-"}</span></div><p className="text-xs text-muted-foreground">{competitor.sanego_rating?.review_count || 0}</p></div>
                </div>
                <Badge className={getThreatLevelColor(competitor.threat_level)}>{competitor.threat_level}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {ratingSummary && (ratingSummary.best_rated_competitor || ratingSummary.worst_rated_competitor) && (
        <div className="grid md:grid-cols-2 gap-4">
          {ratingSummary.best_rated_competitor && <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20"><CardHeader><CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400"><Star className="h-5 w-5 fill-green-500 text-green-500" />Best Bewertet</CardTitle></CardHeader><CardContent><p className="font-medium">{ratingSummary.best_rated_competitor}</p><p className="text-sm text-muted-foreground mt-1">Starkster Konkurrent in Online-Reputation</p></CardContent></Card>}
          {ratingSummary.worst_rated_competitor && <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20"><CardHeader><CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400"><AlertTriangle className="h-5 w-5 text-red-500" />Schwachste Bewertung</CardTitle></CardHeader><CardContent><p className="font-medium">{ratingSummary.worst_rated_competitor}</p><p className="text-sm text-muted-foreground mt-1">Potenzielle Chance</p></CardContent></Card>}
        </div>
      )}
      {analysis.patient_reviews_analysis && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Bewertungs-Analyse</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><h4 className="font-medium text-green-600 mb-2">Haufiges Lob</h4><ul className="space-y-1">{analysis.patient_reviews_analysis.common_praise_topics?.map((topic: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{topic}</li>)}</ul></div>
              <div><h4 className="font-medium text-red-600 mb-2">Haufige Kritik</h4><ul className="space-y-1">{analysis.patient_reviews_analysis.common_complaint_topics?.map((topic: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{topic}</li>)}</ul></div>
            </div>
            {analysis.patient_reviews_analysis.review_strategy && <div className="pt-4 border-t"><h4 className="font-medium mb-2">Empfohlene Bewertungsstrategie</h4><p className="text-sm text-muted-foreground">{analysis.patient_reviews_analysis.review_strategy}</p></div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Tab: SWOT ---

export function SwotTab({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-4">
      {analysis.strengths_weaknesses && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-green-200"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-5 w-5" />Marktstarken</CardTitle></CardHeader><CardContent><ul className="space-y-2">{analysis.strengths_weaknesses.market_strengths?.map((s: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><span className="text-green-500 mt-1">{'\u2713'}</span>{s}</li>)}</ul></CardContent></Card>
          <Card className="border-red-200"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="h-5 w-5" />Marktschwachen</CardTitle></CardHeader><CardContent><ul className="space-y-2">{analysis.strengths_weaknesses.market_weaknesses?.map((w: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><span className="text-red-500 mt-1">{'\u2717'}</span>{w}</li>)}</ul></CardContent></Card>
        </div>
      )}
      {analysis.opportunities?.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" />Chancen</CardTitle></CardHeader><CardContent><div className="space-y-3">{analysis.opportunities.map((opp: any, i: number) => <div key={i} className="p-3 border rounded-lg"><div className="flex items-start justify-between"><h4 className="font-medium">{opp.title}</h4><Badge className={getPriorityColor(opp.priority)}>{opp.priority}</Badge></div><p className="text-sm text-muted-foreground mt-1">{opp.description}</p>{opp.implementation_effort && <p className="text-xs text-muted-foreground mt-2">Aufwand: {opp.implementation_effort}</p>}</div>)}</div></CardContent></Card>
      )}
      {analysis.threats?.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-red-500" />Risiken</CardTitle></CardHeader><CardContent><div className="space-y-3">{analysis.threats.map((threat: any, i: number) => <div key={i} className="p-3 border rounded-lg"><div className="flex items-start justify-between"><h4 className="font-medium">{threat.title}</h4><Badge className={getPriorityColor(threat.severity)}>{threat.severity}</Badge></div><p className="text-sm text-muted-foreground mt-1">{threat.description}</p>{threat.mitigation && <p className="text-xs text-primary mt-2"><strong>Gegenmassnahme:</strong> {threat.mitigation}</p>}</div>)}</div></CardContent></Card>
      )}
    </div>
  )
}

// --- Tab: Pricing ---

export function PricingTab({ analysis }: { analysis: any }) {
  if (!analysis.pricing_comparison) return null
  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Preisübersicht</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{analysis.pricing_comparison.overview}</p>{analysis.pricing_comparison.pricing_strategy && <div className="mt-4 p-3 bg-primary/10 rounded-lg"><h4 className="font-medium mb-1">Empfohlene Preisstrategie</h4><p className="text-sm">{analysis.pricing_comparison.pricing_strategy}</p></div>}</CardContent></Card>
      {analysis.pricing_comparison.igel_services?.length > 0 && (
        <Card><CardHeader><CardTitle>IGeL-Leistungen Preisvergleich</CardTitle></CardHeader><CardContent><div className="space-y-3">{analysis.pricing_comparison.igel_services.map((service: any, i: number) => <div key={i} className="flex items-center justify-between p-3 border rounded-lg"><div><h4 className="font-medium">{service.service}</h4><p className="text-sm text-muted-foreground">Marktdurchschnitt: {service.market_average}</p></div><div className="text-right"><p className="text-sm font-medium text-primary">{service.recommendation}</p></div></div>)}</div></CardContent></Card>
      )}
    </div>
  )
}

// --- Tab: Online ---

export function OnlineTab({ analysis }: { analysis: any }) {
  if (!analysis.online_presence) return null
  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Online-Prasenz Analyse</CardTitle></CardHeader><CardContent className="space-y-4">{analysis.online_presence.importance && <div><h4 className="font-medium mb-1">Bedeutung</h4><p className="text-sm text-muted-foreground">{analysis.online_presence.importance}</p></div>}{analysis.online_presence.competitor_analysis && <div><h4 className="font-medium mb-1">Konkurrenz-Analyse</h4><p className="text-sm text-muted-foreground">{analysis.online_presence.competitor_analysis}</p></div>}{analysis.online_presence.review_management && <div><h4 className="font-medium mb-1">Bewertungsmanagement</h4><p className="text-sm text-muted-foreground">{analysis.online_presence.review_management}</p></div>}</CardContent></Card>
      {analysis.online_presence.seo_opportunities?.length > 0 && <Card><CardHeader><CardTitle>SEO-Chancen</CardTitle></CardHeader><CardContent><ul className="space-y-2">{analysis.online_presence.seo_opportunities.map((opp: string, i: number) => <li key={i} className="flex items-start gap-2"><Target className="h-4 w-4 text-primary mt-1 shrink-0" /><span className="text-sm">{opp}</span></li>)}</ul></CardContent></Card>}
      {analysis.online_presence.social_media_recommendations?.length > 0 && <Card><CardHeader><CardTitle>Social Media Empfehlungen</CardTitle></CardHeader><CardContent><ul className="space-y-2">{analysis.online_presence.social_media_recommendations.map((rec: string, i: number) => <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" /><span className="text-sm">{rec}</span></li>)}</ul></CardContent></Card>}
    </div>
  )
}

// --- Tab: Recommendations ---

export function RecommendationsTab({ analysis }: { analysis: any }) {
  if (!analysis.recommendations?.length) return <Card><CardContent className="py-8 text-center text-muted-foreground">Keine Empfehlungen verfügbar</CardContent></Card>
  return (
    <div className="space-y-4">
      {analysis.recommendations.map((rec: any, i: number) => (
        <Card key={i}>
          <CardHeader><div className="flex items-start justify-between"><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" />{rec.title}</CardTitle><div className="flex gap-2"><Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>{rec.timeline && <Badge variant="outline">{rec.timeline}</Badge>}</div></div></CardHeader>
          <CardContent><p className="text-muted-foreground">{rec.description}</p>{rec.expected_impact && <p className="text-sm text-primary mt-2"><strong>Erwarteter Effekt:</strong> {rec.expected_impact}</p>}</CardContent>
        </Card>
      ))}
    </div>
  )
}
