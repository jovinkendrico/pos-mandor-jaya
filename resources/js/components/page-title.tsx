export default function PageTitle({ title, ...props }: { title: string }) {
    return <h1 className="text-3xl font-bold">{title}</h1>;
}
