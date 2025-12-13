"use client"

import * as React from "react";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";

interface HoverableButtonProps extends React.ComponentProps<typeof Button> {
  hoverText?: string;
}

function HoverableButton({
  hoverText,
  children,
  onClick,
  onMouseDown,
  ...buttonProps
}: HoverableButtonProps) {
  const [open, setOpen] = React.useState(false);

  // Close tooltip immediately on click to prevent interference
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(false);
    onClick?.(e);
  }, [onClick]);

  const button = (
    <Button {...buttonProps} onClick={handleClick} onMouseDown={onMouseDown}>
      {children}
    </Button>
  );

  if (!hoverText) {
    return button;
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={100}>
      <TooltipTrigger asChild>
        {button}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={4}
        className="pointer-events-none"
      >
        {hoverText}
      </TooltipContent>
    </Tooltip>
  );
}

export { HoverableButton, type HoverableButtonProps };

