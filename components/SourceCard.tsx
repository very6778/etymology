import { ReactNode } from "react";
import { BookOpen, Scroll, Book, FileText } from "lucide-react";

export type SourceType = "tdk" | "nisanyan" | "aksozluk" | "etimolojitr";

interface SourceCardProps {
    source: SourceType;
    children: ReactNode;
    error?: boolean;
}

const sourceConfig = {
    tdk: {
        name: "TDK",
        icon: BookOpen,
        className: "source-card--tdk",
    },
    nisanyan: {
        name: "Nisanyan Sözlük",
        icon: Scroll,
        className: "source-card--nisanyan",
    },
    aksozluk: {
        name: "Aksözlük",
        icon: Book,
        className: "source-card--aksozluk",
    },
    etimolojitr: {
        name: "Etimoloji Türkçe",
        icon: FileText,
        className: "source-card--etimolojitr",
    },
};

export function SourceCard({ source, children, error }: SourceCardProps) {
    const config = sourceConfig[source];
    const Icon = config.icon;

    if (error) {
        return (
            <div className="error-card">
                <div className="source-card__header">
                    <Icon size={16} />
                    {config.name}
                </div>
                <p>Şu an ulaşılamıyor</p>
            </div>
        );
    }

    return (
        <div className={`source-card ${config.className}`}>
            <div className="source-card__header">
                <Icon size={16} />
                {config.name}
            </div>
            <div className="source-card__content">{children}</div>
        </div>
    );
}
