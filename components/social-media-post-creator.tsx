"use client"

import type React from "react"

import { useState, useCallback } from "react"
import {
  SOCIAL_MEDIA_PLATFORMS,
  type PlatformId,
  validateText,
  validateHashtags,
  getFalImageSize,
  getGoogleAspectRatio,
} from "@/lib/social-media-platforms"
import { AI_IMAGE_MODELS, getSocialMediaModel } from "@/lib/ai-image-models"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Video,
  Pin,
  ImageIcon,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Hash,
  Type,
  FileImage,
  Lightbulb,
  Send,
  Eye,
  Loader2,
  Info,
  Smartphone,
  Monitor,
} from "lucide-react"
import Image from "next/image"

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <Video className="h-4 w-4" />,
  pinterest: <Pin className="h-4 w-4" />,
}

interface SocialMediaPost {
  platform: PlatformId
  text: string
  hashtags: string
  imagePrompt: string
  imageUrl?: string
  contentType: "feedPost" | "story"
}

interface SocialMediaPostCreatorProps {
  practiceId?: string
  initialContent?: string
  onPostCreated?: (post: SocialMediaPost) => void
}

export function SocialMediaPostCreator({
  practiceId,
  initialContent = "",
  onPostCreated,
}: SocialMediaPostCreatorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("instagram")
  const [contentType, setContentType] = useState<"feedPost" | "story">("feedPost")
  const [postText, setPostText] = useState(initialContent)
  const [hashtags, setHashtags] = useState("")
  const [imagePrompt, setImagePrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [selectedModel, setSelectedModel] = useState(getSocialMediaModel().id)
  const [showPreview, setShowPreview] = useState(false)
  const [autoOptimize, setAutoOptimize] = useState(true)

  const platform = SOCIAL_MEDIA_PLATFORMS[selectedPlatform]
  const textValidation = validateText(selectedPlatform, postText + (hashtags ? `\n\n${hashtags}` : ""))
  const hashtagValidation = validateHashtags(selectedPlatform, hashtags)
  const imageSpec = platform.image[contentType] || platform.image.feedPost

  // Calculate text usage percentage
  const textUsagePercent = Math.min((textValidation.charCount / platform.text.maxLength) * 100, 100)
  const isOptimalLength = textValidation.charCount <= platform.text.optimalLength

  // Generate AI image
  const generateImage = useCallback(async () => {
    if (!imagePrompt.trim()) return

    setIsGeneratingImage(true)
    try {
      const model = AI_IMAGE_MODELS.find((m) => m.id === selectedModel)
      const isGoogleModel = model?.provider === "google"

      const response = await fetch("/api/generate-social-media-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          modelId: selectedModel,
          platform: `${selectedPlatform}_${contentType === "story" ? "story" : "square"}`,
          customSettings: isGoogleModel
            ? { aspectRatio: getGoogleAspectRatio(selectedPlatform, contentType) }
            : { image_size: getFalImageSize(selectedPlatform, contentType) },
        }),
      })

      const data = await response.json()
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl)
      } else {
        console.error("Image generation failed:", data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsGeneratingImage(false)
    }
  }, [imagePrompt, selectedModel, selectedPlatform, contentType])

  // Auto-optimize text for platform
  const optimizeText = useCallback(() => {
    if (!autoOptimize) return

    let optimized = postText

    // Truncate if too long
    if (optimized.length > platform.text.maxLength) {
      optimized = optimized.substring(0, platform.text.maxLength - 3) + "..."
    }

    setPostText(optimized)
  }, [postText, platform.text.maxLength, autoOptimize])

  // Copy to clipboard
  const copyToClipboard = async () => {
    const fullText = postText + (hashtags ? `\n\n${hashtags}` : "")
    await navigator.clipboard.writeText(fullText)
  }

  // Download image
  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${selectedPlatform}-${contentType}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Social Media Post erstellen
          </CardTitle>
          <CardDescription>
            Erstelle optimierte Posts für verschiedene Plattformen mit den richtigen Bildgrößen und Textlängen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Platform Tabs */}
            <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as PlatformId)}>
              <TabsList className="grid w-full grid-cols-7 h-auto">
                {Object.entries(SOCIAL_MEDIA_PLATFORMS).map(([id, p]) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex flex-col items-center gap-1 py-2 data-[state=active]:text-white"
                    style={
                      {
                        "--platform-color": p.color,
                        backgroundColor: selectedPlatform === id ? p.color : undefined,
                      } as React.CSSProperties
                    }
                  >
                    {platformIcons[id]}
                    <span className="text-xs hidden sm:block">{p.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Content Type Selection */}
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Format:</Label>
              <div className="flex gap-2">
                <Button
                  variant={contentType === "feedPost" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentType("feedPost")}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Feed Post
                </Button>
                <Button
                  variant={contentType === "story" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentType("story")}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Story/Reels
                </Button>
              </div>
            </div>

            {/* Platform Info */}
            <div
              className="rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: platform.color, backgroundColor: `${platform.color}10` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {platformIcons[selectedPlatform]}
                    {platform.name} - {contentType === "story" ? "Story" : "Feed Post"}
                  </h4>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bildgröße:</span>
                      <p className="font-medium">
                        {imageSpec.width} x {imageSpec.height}px
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Seitenverhältnis:</span>
                      <p className="font-medium">{imageSpec.aspectRatio}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max. Zeichen:</span>
                      <p className="font-medium">{platform.text.maxLength.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Optimal:</span>
                      <p className="font-medium">{platform.text.optimalLength} Zeichen</p>
                    </div>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-semibold mb-2">Best Practices:</p>
                      <ul className="text-sm space-y-1">
                        {platform.bestPractices.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Text & Hashtags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto Optimize Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-optimize" className="text-sm">
                Text automatisch optimieren
              </Label>
              <Switch id="auto-optimize" checked={autoOptimize} onCheckedChange={setAutoOptimize} />
            </div>

            {/* Post Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Post-Text</Label>
                <div className="flex items-center gap-2">
                  {textValidation.valid ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {textValidation.charCount} / {platform.text.maxLength}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {textValidation.charCount} / {platform.text.maxLength}
                    </Badge>
                  )}
                </div>
              </div>
              <Textarea
                placeholder={`Schreibe deinen ${platform.name} Post hier...`}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="min-h-[150px] resize-none"
                maxLength={platform.text.maxLength + 100}
              />
              <div className="space-y-1">
                <Progress
                  value={textUsagePercent}
                  className={`h-1 ${textUsagePercent > 100 ? "[&>div]:bg-destructive" : isOptimalLength ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"}`}
                />
                <p className="text-xs text-muted-foreground">
                  {isOptimalLength ? (
                    <span className="text-green-600">Optimale Länge für maximales Engagement</span>
                  ) : textValidation.charCount <= platform.text.maxLength ? (
                    <span className="text-amber-600">
                      Längerer Text - {platform.text.optimalLength} Zeichen sind optimal
                    </span>
                  ) : (
                    <span className="text-destructive">Text ist zu lang für {platform.name}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </Label>
                {platform.text.hashtagLimit && (
                  <Badge variant={hashtagValidation.valid ? "outline" : "destructive"}>
                    {hashtagValidation.count} / {hashtagValidation.limit}
                  </Badge>
                )}
              </div>
              <Input
                placeholder="#praxismanagement #arztpraxis #effizienz"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
              {!hashtagValidation.valid && <p className="text-xs text-destructive">{hashtagValidation.message}</p>}
              {platform.text.hashtagLimit && (
                <p className="text-xs text-muted-foreground">
                  {platform.name} empfiehlt max. {platform.text.hashtagLimit} Hashtags
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1 bg-transparent">
                <Copy className="h-4 w-4 mr-2" />
                Text kopieren
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Vorschau
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Image Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Bild generieren
            </CardTitle>
            <CardDescription>
              Optimiert für {platform.name} ({imageSpec.width}x{imageSpec.height}px, {imageSpec.aspectRatio})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label>KI-Modell</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_IMAGE_MODELS.filter((m) => m.bestFor.some((b) => b.toLowerCase().includes("social"))).map(
                    (model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {model.quality}
                          </Badge>
                        </div>
                      </SelectItem>
                    ),
                  )}
                  <Separator className="my-1" />
                  {AI_IMAGE_MODELS.filter((m) => !m.bestFor.some((b) => b.toLowerCase().includes("social"))).map(
                    (model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {model.quality}
                          </Badge>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Image Prompt */}
            <div className="space-y-2">
              <Label>Bildbeschreibung</Label>
              <Textarea
                placeholder="Beschreibe das gewünschte Bild für deinen Social Media Post..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Generate Button */}
            <Button onClick={generateImage} disabled={!imagePrompt.trim() || isGeneratingImage} className="w-full">
              {isGeneratingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere Bild...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Bild generieren ({imageSpec.width}x{imageSpec.height})
                </>
              )}
            </Button>

            {/* Generated Image Preview */}
            {generatedImage && (
              <div className="space-y-2">
                <div
                  className="relative rounded-lg overflow-hidden border bg-muted"
                  style={{
                    aspectRatio: imageSpec.aspectRatio.replace(":", "/"),
                  }}
                >
                  <Image
                    src={generatedImage || "/placeholder.svg"}
                    alt="Generated social media image"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadImage} className="flex-1 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Herunterladen
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateImage} className="flex-1 bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Neu generieren
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vorschau: {platform.name} {contentType === "story" ? "Story" : "Post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div
                className="border rounded-lg overflow-hidden bg-white shadow-lg"
                style={{
                  width: contentType === "story" ? "280px" : "400px",
                  maxWidth: "100%",
                }}
              >
                {/* Mock Platform Header */}
                <div
                  className="flex items-center gap-2 p-3 border-b"
                  style={{ backgroundColor: `${platform.color}10` }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platformIcons[selectedPlatform]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Meine Praxis</p>
                    <p className="text-xs text-muted-foreground">Gesponsert</p>
                  </div>
                </div>

                {/* Image */}
                <div
                  className="bg-muted"
                  style={{
                    aspectRatio: imageSpec.aspectRatio.replace(":", "/"),
                  }}
                >
                  {generatedImage ? (
                    <Image
                      src={generatedImage || "/placeholder.svg"}
                      alt="Preview"
                      width={imageSpec.width}
                      height={imageSpec.height}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {postText || "Dein Post-Text erscheint hier..."}
                    {hashtags && <span className="text-blue-600 block mt-2">{hashtags}</span>}
                  </p>
                </div>

                {/* Mock Engagement */}
                <div className="px-3 pb-3 flex items-center gap-4 text-muted-foreground text-xs">
                  <span>123 Likes</span>
                  <span>45 Kommentare</span>
                  <span>12 Shares</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Best Practices für {platform.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platform.bestPractices.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Unterstützte Formate</p>
              <p className="font-medium">{platform.formats.join(", ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max. Dateigröße</p>
              <p className="font-medium">{imageSpec.maxFileSize}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Link-Vorschau</p>
              <p className="font-medium">{platform.text.linkPreview ? "Ja" : "Nein"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hashtag-Limit</p>
              <p className="font-medium">{platform.text.hashtagLimit || "Unbegrenzt"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
