import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Group } from "./types";
import { getInitials } from "./utils";
import { ArrowLeft, MoreVertical } from "lucide-react";

interface ChatHeaderProps {
  group: Group;
  onBack: () => void;
}

export default function ChatHeader({ group, onBack }: ChatHeaderProps) {
  return (
    <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
      <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back</span>
      </Button>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {getInitials(group.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-base">{group.name}</h2>
          <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
        </div>
      </div>
      <div className="ml-auto">
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Group options</span>
        </Button>
      </div>
    </header>
  );
}