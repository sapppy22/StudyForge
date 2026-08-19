import { withUser } from "@/lib/api";
import { listTests } from "@/services/tests/testService";

export const GET = withUser(async ({ user }) => listTests(user.id));
