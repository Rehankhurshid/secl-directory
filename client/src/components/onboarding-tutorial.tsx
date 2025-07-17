import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, Filter, Users, MessageSquare, Bell, Download, 
  ArrowRight, ArrowLeft, X, CheckCircle, User, Phone, Mail
} from 'lucide-react';

interface OnboardingTutorialProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to SECL Employee Directory",
    description: "Your comprehensive employee directory with real-time messaging and notifications",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Complete Employee Database</h3>
          <p className="text-muted-foreground text-sm">
            Access detailed information for all 2,800+ SECL employees with advanced search and filtering
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <Search className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-xs font-medium">Smart Search</p>
          </div>
          <div className="text-center">
            <MessageSquare className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <p className="text-xs font-medium">Group Chat</p>
          </div>
          <div className="text-center">
            <Bell className="w-6 h-6 mx-auto text-orange-500 mb-1" />
            <p className="text-xs font-medium">Push Notifications</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Search & Filter Employees",
    description: "Find employees quickly using our advanced search and filtering system",
    content: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Search className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium">Search by Name or Employee ID</p>
            <p className="text-sm text-muted-foreground">Type in the search box to find specific employees</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Filter className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium">Advanced Filters</p>
            <p className="text-sm text-muted-foreground">Filter by department, location, grade, and more</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Available Filters:</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">Department</Badge>
            <Badge variant="outline" className="text-xs">Location</Badge>
            <Badge variant="outline" className="text-xs">Grade</Badge>
            <Badge variant="outline" className="text-xs">Category</Badge>
            <Badge variant="outline" className="text-xs">Gender</Badge>
            <Badge variant="outline" className="text-xs">Blood Group</Badge>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Employee Details & Actions",
    description: "View comprehensive employee information and perform actions",
    content: (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-sm text-muted-foreground">Senior Engineer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span>Call Employee</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Send Email</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>View Full Details</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-orange-600" />
                <span>Share Contact</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Pro Tip:</strong> Click on any employee card to see their complete profile with all available information, including contact details, work information, and addresses.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "Group Messaging",
    description: "Create groups and communicate with team members in real-time",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Real-time Group Chat</h3>
          <p className="text-muted-foreground">
            Create groups, add members, and communicate instantly with your colleagues
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <div>
              <p className="font-medium text-sm">Create Groups</p>
              <p className="text-xs text-muted-foreground">Start a new conversation with team members</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
            <div>
              <p className="font-medium text-sm">Add Members</p>
              <p className="text-xs text-muted-foreground">Search and select employees to join the group</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
            <div>
              <p className="font-medium text-sm">Start Chatting</p>
              <p className="text-xs text-muted-foreground">Send messages and receive real-time responses</p>
            </div>
          </div>
        </div>
      </div>
    )
  },

  {
    id: 5,
    title: "Progressive Web App",
    description: "Install the app for a native mobile experience",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Download className="w-12 h-12 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Install as App</h3>
          <p className="text-muted-foreground">
            Add SECL Directory to your home screen for quick access and offline functionality
          </p>
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="font-medium text-sm">📱 Mobile Install</p>
            <p className="text-xs text-muted-foreground">
              Look for the "Add to Home Screen" option in your browser menu
            </p>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="font-medium text-sm">💻 Desktop Install</p>
            <p className="text-xs text-muted-foreground">
              Click the install button in your browser's address bar
            </p>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="font-medium text-sm">🌐 Offline Access</p>
            <p className="text-xs text-muted-foreground">
              Access employee information even without internet connection
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export function OnboardingTutorial({ open, onClose }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (open) {
      setShowOnboarding(true);
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    onClose();
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <Dialog open={showOnboarding} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{currentStepData?.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {currentStepData?.description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {currentStepData?.content}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip Tutorial
              </Button>
              
              {currentStep === tutorialSteps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Get Started</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (!onboardingCompleted) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    showOnboarding,
    setShowOnboarding
  };
}