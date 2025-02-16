
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUpiSchema } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertUpi } from "@shared/schema";

export default function UpiForm() {
  const { toast } = useToast();
  
  const form = useForm<InsertUpi>({
    resolver: zodResolver(insertUpiSchema),
    defaultValues: {
      upiId: "",
      merchantName: "",
      storeName: "",
      merchantCategory: "general",
      businessType: "retail",
      dailyLimit: 50000
    },
  });

  const onSubmit = async (data: InsertUpi) => {
    try {
      await apiRequest("POST", "/api/upi", data);
      queryClient.invalidateQueries({ queryKey: ["/api/upi"] });
      form.reset();
      toast({
        title: "Success",
        description: "UPI ID added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add UPI ID",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="Merchant Name"
          {...form.register("merchantName")}
          className="bg-white/5 border-red-500/20 text-white"
        />
        {form.formState.errors.merchantName && (
          <p className="text-sm text-red-400 mt-1">
            {form.formState.errors.merchantName.message}
          </p>
        )}
      </div>
      
      <div>
        <Input
          placeholder="Store Name"
          {...form.register("storeName")}
          className="bg-white/5 border-red-500/20 text-white"
        />
        {form.formState.errors.storeName && (
          <p className="text-sm text-red-400 mt-1">
            {form.formState.errors.storeName.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="UPI ID (e.g. name@upi)"
          {...form.register("upiId")}
          className="bg-white/5 border-red-500/20 text-white"
        />
        {form.formState.errors.upiId && (
          <p className="text-sm text-red-400 mt-1">
            {form.formState.errors.upiId.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="number"
          placeholder="Daily Limit"
          {...form.register("dailyLimit", { valueAsNumber: true })}
          className="bg-white/5 border-red-500/20 text-white"
        />
        {form.formState.errors.dailyLimit && (
          <p className="text-sm text-red-400 mt-1">
            {form.formState.errors.dailyLimit.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
        Add UPI ID
      </Button>
    </form>
  );
}
