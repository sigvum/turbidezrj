import { getServerSession } from "next-auth";
import { options } from "./api/auth/[...nextauth]/options";
import CheckUser from "./components/CheckUser";

const Home = async () => {
  const session = await getServerSession(options);

  return <CheckUser />;
};

export default Home;
