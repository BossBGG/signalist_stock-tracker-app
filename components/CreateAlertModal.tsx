"use client";

import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useForm } from "react-hook-form";
import InputField from "./form/InputField";
import SelectField from "./form/SelectField";
import { Button } from "./ui/button";
import { ALERT_TYPE_OPTIONS, CONDITION_OPTIONS, FREQUENCY_OPTIONS } from "@/lib/constants";
import { createAlert, updateAlert } from "@/lib/actions/alert.actions"; 
import { toast } from "sonner";

interface CreateAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultSymbol?: string;
  defaultCompany?: string;
  watchlist: any[]; 
  editData?: Alert;
}

const CreateAlertModal = ({ open, setOpen, defaultSymbol, defaultCompany, watchlist , editData}: CreateAlertModalProps) => {
  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      alertName: "",
      symbol: "",
      company: "",
      alertType: "price",
      condition: "greater",
      threshold: "",
      frequency: "once_per_minute"
    }
  });

  useEffect(() => {
    if(editData){
        setValue("alertName", editData.alertName);
        setValue("symbol", editData.symbol);
        setValue("company", editData.company);
        setValue("alertType", editData.alertType);
        setValue("condition", editData.condition);
        setValue("threshold", editData.threshold.toString());
        setValue("frequency", editData.frequency || " ");
    }
    else if (defaultSymbol && defaultCompany) {
      setValue("symbol", defaultSymbol);
      setValue("company", defaultCompany);
      setValue("alertName", `${defaultCompany} Alert`);
    }
  }, [defaultSymbol, defaultCompany, editData, setValue, open]);


  const onSubmit = async (data: any) => {
    console.log("[MODAL] Submit data:", data);
    console.log("[MODAL] Edit mode:", !!editData, "ID:", editData?.id);
    
    const selectedStock = watchlist.find(s => s.symbol === data.symbol);
    const payload = {
        ...data,
        company: data.company || selectedStock?.company || data.symbol
    };

    const result = editData 
      ? await updateAlert(editData.id, payload)
      : await createAlert(payload);
      
    console.log("[MODAL] Result:", result);
      
    if (result.success) {
      toast.success(editData ? "Alert updated successfully" : "Alert created successfully");
      setOpen(false);
      reset();
      window.location.reload();
    } else {
      toast.error(editData ? "Failed to update alert" : "Failed to create alert");
    }
  };

  const stockOptions = watchlist.map(s => ({ label: `${s.symbol} - ${s.company}`, value: s.symbol }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">{editData ? "Edit" : "Create"} Price Alert</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField 
            name="alertName" 
            label="Alert Name" 
            placeholder="e.g. Apple at Discount" 
            register={register} 
            error={errors.alertName}
            validation={{ required: "Required" }}
          />

          {defaultSymbol ? (
             <div className="space-y-2">
                <label className="form-label">Stock Identifier</label>
                <div className="form-input flex items-center text-gray-400">
                    {defaultCompany} ({defaultSymbol})
                </div>
                <input type="hidden" {...register("symbol")} />
             </div>
          ) : (
             <SelectField 
                name="symbol"
                label="Stock Identifier"
                placeholder="Select stock from watchlist"
                options={stockOptions}
                control={control}
                error={errors.symbol}
                required
             />
          )}

          <SelectField 
            name="alertType"
            label="Alert Type"
            placeholder="Upper/lower"
            options={ALERT_TYPE_OPTIONS}
            control={control}
            error={errors.alertType}
          />

          <SelectField 
            name="condition"
            label="Condition"
            placeholder="Select condition"
            options={CONDITION_OPTIONS}
            control={control}
            error={errors.condition}
          />

          <InputField 
            name="threshold" 
            label="Threshold Value" 
            placeholder="" 
            type="number"
            register={register} 
            error={errors.threshold}
            validation={{ required: "Required" }}
          />

          <SelectField 
            name="frequency"
            label="Check Frequency"
            placeholder="Select frequency"
            options={FREQUENCY_OPTIONS}
            control={control}
            error={errors.frequency}
          />

          <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-2">
            {isSubmitting ? (editData ? "Updating..." : "Creating...") : (editData ? "Update Alert" : "Create Alert")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlertModal;