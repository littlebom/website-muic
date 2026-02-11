"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Link as LinkIcon, MessageCircle, Check } from "lucide-react";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  const shareText = description || title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, "_blank", "width=600,height=400");
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-700">แชร์ข่าวนี้:</h3>
      <div className="flex flex-wrap gap-2">
        {/* Facebook */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFacebookShare}
          className="flex items-center gap-2 bg-[#1877F2] text-white hover:bg-[#1877F2]/90 hover:text-white border-[#1877F2]"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>

        {/* Twitter */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          className="flex items-center gap-2 bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 hover:text-white border-[#1DA1F2]"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>

        {/* LINE */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLineShare}
          className="flex items-center gap-2 bg-[#00B900] text-white hover:bg-[#00B900]/90 hover:text-white border-[#00B900]"
        >
          <MessageCircle className="h-4 w-4" />
          LINE
        </Button>

        {/* Copy Link */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">คัดลอกแล้ว!</span>
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              คัดลอกลิงก์
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
