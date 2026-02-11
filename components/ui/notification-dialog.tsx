"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

interface NotificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: NotificationType;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
    autoClose?: number; // Auto close after X milliseconds
}

const iconMap = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
};

const colorMap = {
    success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-500",
        title: "text-green-800",
        button: "bg-green-600 hover:bg-green-700 text-white",
    },
    error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "text-red-500",
        title: "text-red-800",
        button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: "text-amber-500",
        title: "text-amber-800",
        button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "text-blue-500",
        title: "text-blue-800",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    loading: {
        bg: "bg-gray-50",
        border: "border-gray-200",
        icon: "text-gray-500",
        title: "text-gray-800",
        button: "bg-gray-600 hover:bg-gray-700 text-white",
    },
};

export function NotificationDialog({
    open,
    onOpenChange,
    type,
    title,
    message,
    confirmText = "ตกลง",
    cancelText = "ยกเลิก",
    onConfirm,
    onCancel,
    showCancel = false,
    autoClose,
}: NotificationDialogProps) {
    const Icon = iconMap[type];
    const colors = colorMap[type];

    React.useEffect(() => {
        if (autoClose && open && type !== "loading") {
            const timer = setTimeout(() => {
                onOpenChange(false);
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose, open, onOpenChange, type]);

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onOpenChange(false);
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-md ${colors.bg} ${colors.border} border-2`}>
                <DialogHeader className="flex flex-col items-center text-center pt-4">
                    <div className={`mb-4 p-3 rounded-full ${colors.bg}`}>
                        <Icon
                            className={`h-12 w-12 ${colors.icon} ${type === "loading" ? "animate-spin" : ""}`}
                        />
                    </div>
                    <DialogTitle className={`text-xl font-bold ${colors.title}`}>
                        {title}
                    </DialogTitle>
                    {message && (
                        <DialogDescription className="text-center mt-2 text-gray-600">
                            {message}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {type !== "loading" && (
                    <DialogFooter className="flex justify-center gap-3 pt-4">
                        {showCancel && (
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="min-w-[100px]"
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            onClick={handleConfirm}
                            className={`min-w-[100px] ${colors.button}`}
                        >
                            {confirmText}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Hook for easier usage
export function useNotification() {
    const [state, setState] = React.useState<{
        open: boolean;
        type: NotificationType;
        title: string;
        message?: string;
        showCancel?: boolean;
        confirmText?: string;
        autoClose?: number;
        onConfirm?: () => void;
    }>({
        open: false,
        type: "info",
        title: "",
    });

    const showNotification = React.useCallback(
        (options: {
            type: NotificationType;
            title: string;
            message?: string;
            showCancel?: boolean;
            confirmText?: string;
            autoClose?: number;
            onConfirm?: () => void;
        }) => {
            setState({
                open: true,
                ...options,
            });
        },
        []
    );

    const showSuccess = React.useCallback(
        (title: string, message?: string, autoClose?: number) => {
            showNotification({ type: "success", title, message, autoClose });
        },
        [showNotification]
    );

    const showError = React.useCallback(
        (title: string, message?: string) => {
            showNotification({ type: "error", title, message });
        },
        [showNotification]
    );

    const showWarning = React.useCallback(
        (title: string, message?: string, onConfirm?: () => void) => {
            showNotification({ type: "warning", title, message, showCancel: true, onConfirm });
        },
        [showNotification]
    );

    const showInfo = React.useCallback(
        (title: string, message?: string) => {
            showNotification({ type: "info", title, message });
        },
        [showNotification]
    );

    const showLoading = React.useCallback(
        (title: string = "กำลังดำเนินการ...", message?: string) => {
            showNotification({ type: "loading", title, message });
        },
        [showNotification]
    );

    const hideNotification = React.useCallback(() => {
        setState((prev) => ({ ...prev, open: false }));
    }, []);

    const NotificationComponent = React.useCallback(
        () => (
            <NotificationDialog
                open={state.open}
                onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
                type={state.type}
                title={state.title}
                message={state.message}
                showCancel={state.showCancel}
                confirmText={state.confirmText}
                autoClose={state.autoClose}
                onConfirm={state.onConfirm}
            />
        ),
        [state]
    );

    return {
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        hideNotification,
        NotificationComponent,
    };
}
