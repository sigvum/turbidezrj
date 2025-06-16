"use client";

import { useState } from "react";
import { GitMerge, ContactIcon, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { contactDev } from "../actions";

const version = "0.1.0";

export default function Version({ pageProps: { session } }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await contactDev(userName || email, userEmail || email, message);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      setOpen(false);
      handleClear();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setEmail("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="translate-x-4 text-primary text-sm bg-secondary h-3">
          <GitMerge /> {version}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[330px] top-[5%] translate-y-0 z-1000">
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
            </div>
            <div className="flex items-center gap-2 mr-5">
              <GitMerge />
              <span>{version}</span>
            </div>
          </div>
        </DialogTitle>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ContactIcon className="h-5 w-5" />
              Contato
            </CardTitle>
            <CardDescription>
              Envie sua mensagem para o desenvolvedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {session ? (
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.email}
                    />
                    <AvatarFallback>{session.user.email}</AvatarFallback>
                  </Avatar>
                  <span>{session.user.email}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Mensagem:
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border rounded-md h-32 bg-background"
                  placeholder="Digite sua mensagem aqui..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClear}>
                  Limpar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
