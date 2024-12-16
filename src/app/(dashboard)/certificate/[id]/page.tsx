"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { certifyAbi } from "@/config";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { keccak256 } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { z } from "zod";

const formSchema = z.object({
  signer: z.string().nonempty(),
});

export default function Page({ params }: { params: { id: string } }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      signer: "",
    },
  });

  const [ownerOf, setOwnerOf] = useState<string | null>(null);
  const [tokenURI, setTokenURI] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [signer, setSigner] = useState<string | null>(null);

  const publicClient = usePublicClient();
  const account = useAccount();
  const walletClient = useWalletClient({
    account: account.address,
  });

  useEffect(() => {
    publicClient
      ?.readContract({
        abi: certifyAbi,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        functionName: "ownerOf",
        args: [params.id],
      })
      .then((result) => {
        setOwnerOf(String(result));
      });
  });

  useEffect(() => {
    publicClient
      ?.readContract({
        abi: certifyAbi,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        functionName: "tokenURI",
        args: [params.id],
      })
      .then((result) => {
        setTokenURI(String(result));
      });
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    publicClient
      ?.readContract({
        abi: certifyAbi,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        functionName: "verifyCertificate",
        args: [
          params.id,
          keccak256(Buffer.from(String(tokenURI))),
          values.signer,
        ],
      })
      .then((result: any) => {
        setVerified(Boolean(result[0]));
        setSigner(String(result[1]));
      });
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>{ownerOf}</CardTitle>
          <CardDescription>{tokenURI}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="signer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signer</FormLabel>
                    <FormControl>
                      <Input placeholder="0x000..." {...field} />
                    </FormControl>
                    <FormDescription>
                      The address of the signer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Verify</Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p>
            {verified ? "Certificate is Valid!" : "Certificate is not Valid!"}
          </p>
          <p>{verified && `Signed by ${signer}`}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
