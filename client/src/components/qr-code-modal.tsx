import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2 } from "lucide-react";
import QRCode from "qrcode";
import type { Employee } from "@shared/schema";

interface QRCodeModalProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodeModal({ employee, open, onClose }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (employee && open) {
      generateQRCode();
    }
  }, [employee, open]);

  const generateQRCode = async () => {
    if (!employee) return;

    // Create vCard format for contact sharing
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${employee.name}
ORG:${employee.department};${employee.unitName}
TITLE:${employee.designation}
TEL;TYPE=WORK:${employee.phone1 || ""}
EMAIL:${employee.email || ""}
ADR;TYPE=WORK:;;${employee.location};;;;
NOTE:Employee ID: ${employee.employeeId}${employee.bloodGroup ? ` | Blood Group: ${employee.bloodGroup}` : ""}
END:VCARD`;

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(vCard, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl || !employee) return;
    
    const link = document.createElement("a");
    link.download = `${employee.name}_contact_qr.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!qrCodeUrl || !employee) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      const file = new File([blob], `${employee.name}_contact_qr.png`, { type: "image/png" });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${employee.name} - Contact QR Code`,
          text: `Contact information for ${employee.name}`,
          files: [file]
        });
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
      handleDownload();
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Contact QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.designation}</p>
            <p className="text-sm text-muted-foreground">{employee.department}</p>
          </div>

          <div className="flex justify-center bg-white p-4 rounded-lg">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt={`QR Code for ${employee.name}`}
                className="max-w-full h-auto"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Scan this QR code to add contact information to your device</p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
              disabled={!qrCodeUrl}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1"
              disabled={!qrCodeUrl}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}