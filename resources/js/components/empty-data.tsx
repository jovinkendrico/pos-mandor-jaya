import { CircleOff } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';

interface PageProps {
    title: string;
    description?: string;
}
export default function EmptyData(props: PageProps) {
    return (
        <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader className="py-12 text-center">
                <CircleOff size={64} className="mx-auto text-muted-foreground" />
                <CardTitle className="text-2xl font-bold text-muted-foreground">{props.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{props.description}</CardDescription>
            </CardHeader>
        </Card>
    );
}
