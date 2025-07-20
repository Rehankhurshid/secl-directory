import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Group } from "./types";
import { getInitials } from "./utils";
import { ArrowLeft, MoreVertical, Users, Info, Bell, BellOff, Archive, Trash2 } from "lucide-react";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Group options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Group Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Info className="mr-2 h-4 w-4" />
              Group Info
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              View Members
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              Mute Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              Archive Group
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Leave Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}