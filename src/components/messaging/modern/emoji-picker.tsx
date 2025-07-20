"use client";

import { useState } from "react";
import { Search, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

// Common reaction emojis categorized
const EMOJI_CATEGORIES = {
  reactions: {
    name: "Reactions",
    emojis: ["👍", "👎", "❤️", "😂", "😮", "😢", "😡", "🎉", "👏", "🔥", "💯", "✅"]
  },
  faces: {
    name: "Faces",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"]
  },
  hearts: {
    name: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"]
  },
  objects: {
    name: "Objects",
    emojis: ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🪀", "🏓", "🏸", "🥅", "🏒", "🏑", "🥍", "🏏", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "⛸️", "🥌", "🛷", "⛷️", "🏂", "🪂", "🏋️‍♀️", "🏋️", "🤸‍♀️", "🤸", "⛹️‍♀️", "⛹️", "🤺", "🤾‍♀️", "🤾", "🏌️‍♀️", "🏌️", "🧘‍♀️", "🧘", "🏄‍♀️", "🏄", "🏊‍♀️", "🏊", "🤽‍♀️", "🤽", "🚣‍♀️", "🚣", "🧗‍♀️", "🧗", "🚵‍♀️", "🚵", "🚴‍♀️", "🚴", "🏆"]
  }
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flatMap(category => category.emojis);

export function EmojiPicker({ onEmojiSelect, trigger, className }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("reactions");
  const [isOpen, setIsOpen] = useState(false);

  const filteredEmojis = search 
    ? ALL_EMOJIS.filter(emoji => 
        // Simple search - in a real app you'd want emoji names/descriptions
        emoji.includes(search)
      )
    : EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
    setSearch("");
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <SmilePlus className="h-4 w-4" />
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className={cn("w-80 p-0", className)} align="start">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Categories */}
        {!search && (
          <div className="flex gap-1 p-2 border-b bg-muted/20">
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSelectedCategory(key)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Emoji Grid */}
        <div className="p-3">
          {search && filteredEmojis.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No emojis found
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <Button
                  key={`${emoji}-${index}`}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-muted text-lg transition-transform hover:scale-110"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Quick reactions */}
        {!search && (
          <div className="border-t p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-2">Quick reactions</div>
            <div className="flex gap-1">
              {["👍", "❤️", "😂", "😮", "😢", "🎉"].map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-base hover:bg-muted transition-transform hover:scale-110"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Quick reaction button for hovering over messages
interface QuickReactionProps {
  onReact: (emoji: string) => void;
  className?: string;
}

export function QuickReactions({ onReact, className }: QuickReactionProps) {
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

  return (
    <div className={cn(
      "flex items-center gap-1 bg-background border rounded-full p-1 shadow-sm",
      className
    )}>
      {quickEmojis.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-sm hover:bg-muted transition-transform hover:scale-110"
          onClick={() => onReact(emoji)}
        >
          {emoji}
        </Button>
      ))}
      <EmojiPicker
        onEmojiSelect={onReact}
        trigger={
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <SmilePlus className="h-3 w-3" />
          </Button>
        }
      />
    </div>
  );
} 