export default function DashboardPage({
  params,
}: {
  params: { userType: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Dashboard page for user type: {params.userType}
        </p>
      </div>
    </div>
  );
}

