// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CompletedView({ application }: { application: any }) {
    console.log(application); // prevent unused var
    return (
        <div className="text-center py-10">
            <h3 className="text-3xl font-bold mb-4 text-green-600">You are an official YQL Volunteer!</h3>
            <p className="text-lg text-gray-700">Congratulations on completing the entire application process.</p>
        </div>
    );
}
