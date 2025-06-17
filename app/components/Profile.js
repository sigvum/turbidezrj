"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { UserPlus, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { signIn, signOut } from "next-auth/react";
import Version from "./Version";

export default function Profile({ pageProps }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { session, api_url, api_usr, api_pwd } = pageProps || {};

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full p-0">
          {session ? (
            <Avatar>
              <AvatarImage src={session.user.image} alt={session.user.email} />
              <AvatarFallback>{session.user.email?.[0] || "U"}</AvatarFallback>
            </Avatar>
          ) : (
            <UserPlus />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[330px] top-[5%] translate-y-0 z-1000 opacity-90">
        <DialogTitle>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="#1E90FF"
                stroke="#CCCCCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
              </svg>
              <span>TurbidezRJ</span>
              <Version pageProps={{ session }} />
            </div>
          </div>
        </DialogTitle>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Área do usuário</CardTitle>
          </CardHeader>

          {session ? (
            <>
              <CardContent className="flex flex-col gap-4">
                {/* User Info Section */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.email}
                    />
                    <AvatarFallback>
                      {session.user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-lg font-medium">
                    {session.user.name || "Usuário"}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="p-2 rounded-full bg-gray-200 hover:bg-gray-600 dark:bg-gray-200 dark:hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center border border-gray-600 hover:border-gray-400 dark:border-gray-300 dark:hover:border-gray-400 text-gray-900 hover:text-white dark:text-gray-900 dark:hover:text-gray-800"
                        >
                          <LogOut className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="z-1000" side="right">
                        Sair
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {api_url === true ? (
                  <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Acesso ao <i>WFS (Web Feature Service)</i>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p>
                          <span className="font-semibold">URL:</span>{" "}
                          <a
                            href="http://turbidezrj.vercel.app/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            http://turbidezrj.vercel.app/api
                          </a>
                        </p>
                        <p>
                          <span className="font-semibold">Usuário:</span>{" "}
                          {api_usr || "Não disponível"}
                        </p>
                        <p>
                          <span className="font-semibold">Senha:</span>{" "}
                          {api_pwd || "Não disponível"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : api_url === false ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Aguarde a liberação do acesso ao{" "}
                    <i>WFS (Web Feature Service)</i> por parte do administrador.
                  </p>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Status não definido.
                  </p>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center gap-6 p-6 text-center max-w-md mx-auto">
              <p className="text-base md:text-lg text-gray-800 font-medium text-justify leading-relaxed">
                Desbloqueie outros recursos do TurbidezRJ. Faça login com sua
                conta Google para acessar o nosso{" "}
                <i>WFS (Web Feature Service)</i> no padrão{" "}
                <i>OGC API - Features</i> e explorar interativamente os dados
                compilados da Agência Nacional de Águas sobre a turbidez da água
                no Rio de Janeiro.
              </p>
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 hover:bg-gray-50 border border-gray-200 w-full sm:w-auto"
                aria-label="Entrar com a conta Google"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="fill-current"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{isLoading ? "Carregando..." : "Entrar com Google"}</span>
              </Button>
            </CardContent>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
