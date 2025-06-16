import { getServerSession } from "next-auth";
import { options } from "../api/auth/[...nextauth]/options";
import { checkUser } from "../actions";
import Map from "./Map";

const CheckUser = async () => {
  const session = await getServerSession(options);
  const result = await checkUser(session?.user.name, session?.user.email);

  return (
    <>
      {result === "Ativo" ? (
        <Map
          pageProps={{
            session,
            api_url: true,
            api_usr: process.env.API_USR,
            api_pwd: process.env.API_PWD,
          }}
        />
      ) : result === "Inativo" ? (
        <Map pageProps={{ session, api_url: false }} />
      ) : (
        <Map />
      )}
    </>
  );
};

export default CheckUser;
