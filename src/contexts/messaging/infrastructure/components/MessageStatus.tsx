import { Clock, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageStatus as MessageStatusType } from '../../domain/entities/Message';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3" />,
          label: 'Sending...',
          className: 'text-muted-foreground',
        };
      case 'sent':
        return {
          icon: <Check className="h-3 w-3" />,
          label: 'Sent',
          className: 'text-muted-foreground',
        };
      case 'delivered':
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          label: 'Delivered',
          className: 'text-muted-foreground',
        };
      case 'read':
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          label: 'Read',
          className: 'text-blue-500',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Failed to send',
          className: 'text-destructive',
        };
      default:
        return {
          icon: null,
          label: '',
          className: '',
        };
    }
  };

  const { icon, label, className: statusClassName } = getStatusContent();

  if (!icon) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'inline-flex items-center',
            statusClassName,
            className || 'text-inherit opacity-70'
          )}>
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}