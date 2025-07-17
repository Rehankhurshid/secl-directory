import { useState } from "react";
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
import { Loader2, Upload, User, Check } from "lucide-react";
import { Employee } from "@shared/schema";

interface ProfileImageUploadProps {
  employee: Employee;
  onClose: () => void;
}

export function ProfileImageUpload({ employee, onClose }: ProfileImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const updateProfileImage = useUpdateProfileImage();

  const form = useForm<UpdateProfileImageRequest>({
    resolver: zodResolver(updateProfileImageSchema),
    defaultValues: {
      profileImage: employee.profileImage || "",
    },
  });

  const onSubmit = async (data: UpdateProfileImageRequest) => {
    setError(null);
    setSuccess(false);
    
    try {
      await updateProfileImage.mutateAsync(data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile image");
    }
  };

  const watchedImage = form.watch("profileImage");

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Update Profile Picture</CardTitle>
        <CardDescription>
          Add or update your profile picture with a valid image URL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current/Preview Image */}
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={watchedImage || employee.profileImage || ""} alt={employee.name} />
              <AvatarFallback className="text-lg">
                {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image URL</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profileImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="pl-10"
                  {...form.register("profileImage")}
                />
              </div>
              {form.formState.errors.profileImage && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.profileImage.message}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <Check className="h-4 w-4" />
                <AlertDescription>Profile image updated successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfileImage.isPending || success}
              >
                {updateProfileImage.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : success ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Updated!
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Update Picture
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={updateProfileImage.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Tips for best results:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Use a square image (1:1 ratio)</li>
              <li>• Minimum 200x200 pixels</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
              <li>• Keep file size under 5MB</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}