"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  COLUMN_TYPE_VALUES,
  ColumnTypeInline,
  getColumnTypeMeta,
} from "@/features/data-grid/domain/column-types";
import type { Column } from "@contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { EllipsisVertical, Info, Menu } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const columnFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z
    .string()
    .min(1, "Description is required for reliable parsing"),
  type: z.enum(COLUMN_TYPE_VALUES),
  required: z.boolean(),
});

type ColumnFormValues = z.infer<typeof columnFormSchema>;

export function GridHeaderCell(props: {
  column: Column;
  canEditSchema: boolean;

  isEditing: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;

  guidedColumnId: string | null;
  missingDescriptions: Column[];
  onGuidedDescriptionChange: (columnId: string, description: string) => void;

  onUpdateColumn: (columnId: string, patch: Partial<Column>) => void;
}) {
  const {
    column: c,
    canEditSchema,
    isEditing,
    onStartEditing,
    onStopEditing,
    guidedColumnId,
    missingDescriptions,
    onGuidedDescriptionChange,
    onUpdateColumn,
  } = props;

  const missingDescription =
    !c.description || c.description.trim().length === 0;

  const form = useForm<ColumnFormValues>({
    resolver: zodResolver(columnFormSchema),
    defaultValues: {
      name: c.name,
      description: c.description ?? "",
      type: c.type,
      required: c.required ?? false,
    },
  });

  // Update form when column changes
  useEffect(() => {
    form.reset({
      name: c.name,
      description: c.description ?? "",
      type: c.type,
      required: c.required ?? false,
    });
  }, [c.id, c.name, c.description, c.type, c.required, form]);

  const handleSubmit = async (data: ColumnFormValues) => {
    onUpdateColumn(c.id, data);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-2">
      {c.description && c.description.trim().length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={"ghost"} size={"icon"} tabIndex={-1}>
              <Info className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">{c.description}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {isEditing ? (
        <Input
          autoFocus
          defaultValue={c.name}
          className="rounded-none py-0 px-0 h-auto border-0 shadow-none bg-transparent text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          onBlur={(e) => {
            onUpdateColumn(c.id, { name: e.target.value });
            onStopEditing();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            className="truncate text-sm font-medium text-left flex-1 min-w-0"
            onDoubleClick={() => canEditSchema && onStartEditing()}
          >
            {c.name}
            {c.required ? (
              <span className="ml-1 text-destructive">*</span>
            ) : null}
            {missingDescription ? (
              <span
                className="ml-1 text-destructive"
                title="Description required"
              >
                •
              </span>
            ) : null}
          </button>
        </div>
      )}

      {canEditSchema ? (
        <Popover open={guidedColumnId === c.id ? true : undefined}>
          <PopoverTrigger asChild>
            <Button variant={"ghost"} size={"icon"} title="Column settings">
              <EllipsisVertical />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-5">
                  {guidedColumnId === c.id && missingDescription ? (
                    <div className="rounded-md bg-primary/10 border border-primary/20 p-2.5 mb-1">
                      <p className="text-xs font-medium text-primary">
                        {missingDescriptions.findIndex(
                          (col) => col.id === c.id
                        ) + 1}{" "}
                        of {missingDescriptions.length} columns need
                        descriptions
                      </p>
                    </div>
                  ) : null}

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <FormLabel className="text-sm font-semibold">
                              Label
                            </FormLabel>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="size-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-xs">
                                  Column name displayed in the header
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-9 text-sm"
                              placeholder="Persons mentioned"
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-semibold">
                            Format
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value ?? c.type}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <div className="flex items-center gap-2">
                                  <Menu className="size-4 text-muted-foreground" />
                                  <ColumnTypeInline
                                    type={(field.value ?? c.type)}
                                    className="min-w-0"
                                    iconClassName="size-3.5"
                                    labelClassName="text-sm"
                                  />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {COLUMN_TYPE_VALUES.map((t) => {
                                  const meta = getColumnTypeMeta(t);
                                  const Icon = meta.icon;
                                  return (
                                    <SelectItem key={t} value={t}>
                                      <span className="inline-flex items-center gap-2">
                                        <Icon className="size-4 text-muted-foreground" />
                                        <span>{meta.label}</span>
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <FormLabel className="text-sm font-semibold">
                              Prompt
                            </FormLabel>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="size-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-xs">
                                  Instructions for AI extraction
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[100px] resize-none text-sm"
                              placeholder="List the names of all persons mentioned in the document..."
                              autoFocus={guidedColumnId === c.id}
                              onBlur={(e) => {
                                field.onBlur();
                                onGuidedDescriptionChange(c.id, e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between py-1">
                          <FormLabel className="text-sm font-semibold">
                            Required
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" size="sm" className="h-8 px-4">
                      Apply
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
