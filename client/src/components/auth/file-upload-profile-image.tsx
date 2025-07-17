import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileImageSchema, UpdateProfileImageRequest } from "@shared/schema";
import { useUpdateProfileImage } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, User, Check, Link, ImageIcon } from "lucide-react";
import { Employee } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProfileImageProps {
  employee: Employee;
  onClose: () => void;
}

export function FileUploadProfileImage({ employee, onClose }: FileUploadProfileImageProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(employee.profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateProfileImage = useUpdateProfileImage();
  const { toast } = useToast();

  const form = useForm<UpdateProfileImageRequest>({
    resolver: zodResolver(updateProfileImageSchema),
    defaultValues: {
      profileImage: employee.profileImage || "",
    },
  });

  // Watch the profileImage field for debugging
  const profileImageValue = form.watch("profileImage");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log("File converted to base64, length:", dataUrl?.length);
        setPreviewUrl(dataUrl);
        form.setValue('profileImage', dataUrl, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        console.log("Form value set, current value:", form.getValues('profileImage')?.substring(0, 50));
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileImageRequest) => {
    setError(null);
    setSuccess(false);
    
    try {
      console.log("Form data being sent:", data);
      console.log("Current form values:", form.getValues());
      
      // Get the actual current form value
      const currentProfileImage = form.getValues('profileImage');
      
      if (!currentProfileImage) {
        throw new Error("No profile image provided");
      }
      
      // Use the current form value, not the passed data
      const requestData = { profileImage: currentProfileImage };
      console.log("Request data:", requestData);
      
      await updateProfileImage.mutateAsync(requestData);
      setSuccess(true);
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Profile image update error:", err);
      setError(err.message || "Failed to update profile image");
      toast({
        title: "Error",
        description: err.message || "Failed to update profile image",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    form.setValue('profileImage', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Update Profile Picture</CardTitle>
        <CardDescription>
          Upload an image file or provide a URL for your profile picture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current/Preview Image */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || ""} alt={employee.name} />
                <AvatarFallback className="text-lg">
                  {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {previewUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveImage}
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Profile image updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Image URL
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select Image File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF (max 2MB)
                </p>
              </div>
              
              {previewUrl && profileImageValue && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      console.log("Submit button clicked, form value:", form.getValues('profileImage')?.substring(0, 50));
                      // Call onSubmit directly with current form values
                      const formData = form.getValues();
                      console.log("Form data:", formData);
                      onSubmit(formData);
                    }}
                    disabled={updateProfileImage.isPending || isUploading}
                    className="flex-1"
                  >
                    {updateProfileImage.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Update Image
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={updateProfileImage.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile Image URL</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profileImage"
                      type="url"
                      placeholder="https://example.com/profile.jpg"
                      className="pl-10"
                      {...form.register("profileImage")}
                      onChange={(e) => {
                        form.setValue("profileImage", e.target.value);
                        setPreviewUrl(e.target.value);
                      }}
                    />
                  </div>
                  {form.formState.errors.profileImage && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.profileImage.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateProfileImage.isPending}
                    className="flex-1"
                  >
                    {updateProfileImage.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Update Image
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>


        </div>
      </CardContent>
    </Card>
  );
}