"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { keccak256 } from "viem";
import { certifyAbi } from "@/config";

const formSchema = z.object({
  recipient: z.string().nonempty(),
  message: z.string().nonempty(),
});

export default function Page() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      message: "",
    },
  });
  const account = useAccount();
  const walletClient = useWalletClient({
    account: account.address,
  });
  const publicClient = usePublicClient();

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    console.log("Publishing certificate...");
    console.log("Hash message:", keccak256(Buffer.from(values.message)));

    walletClient.data
      ?.request({
        method: "personal_sign",
        params: [
          keccak256(Buffer.from(values.message)),
          walletClient.data.account.address,
        ],
      })
      .then(async (result) => {
        console.log("Signature:", result);

        publicClient
          ?.readContract({
            abi: certifyAbi,
            address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
            functionName: "splitSignature",
            args: [result],
          })
          .then((result: any) => {
            console.log({
              r: result[0],
              s: result[1],
              v: result[2],
            });

            walletClient.data
              .writeContract({
                account: account.address,
                abi: certifyAbi,
                address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                functionName: "publishCertificateToken",
                args: [
                  values.recipient,
                  result[2],
                  result[0],
                  result[1],
                  values.message,
                ],
              })
              .then((result) => {
                console.log("Result:", result);
                form.reset();
              });
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Publish your tokenized certificate!</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                      <Input placeholder="0x000..." {...field} />
                    </FormControl>
                    <FormDescription>
                      The address for the recipient of certificate token.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Input placeholder="hello" {...field} />
                    </FormControl>
                    <FormDescription>
                      The message to be signed by the certificate token.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Publish</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
