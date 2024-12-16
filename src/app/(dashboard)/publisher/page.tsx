"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { useAccount, useWalletClient } from "wagmi";
import { z } from "zod";

const formSchemaGiveRightToPublish = z.object({
  address: z.string().nonempty(),
  username: z.string().nonempty(),
});

const formSchemaRevokeRightToPublish = z.object({
  address: z.string().nonempty(),
});

export default function Page() {
  const account = useAccount();
  const walletClient = useWalletClient({
    account: account.address,
  });

  const giveRightToPublishForm = useForm<
    z.infer<typeof formSchemaGiveRightToPublish>
  >({
    resolver: zodResolver(formSchemaGiveRightToPublish),
    defaultValues: {
      address: "",
      username: "",
    },
  });
  const revokeRightToPublishForm = useForm<
    z.infer<typeof formSchemaRevokeRightToPublish>
  >({
    resolver: zodResolver(formSchemaRevokeRightToPublish),
    defaultValues: {
      address: "",
    },
  });

  function onSubmitGiveRightToPublish(
    values: z.infer<typeof formSchemaGiveRightToPublish>
  ) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    console.log("Giving right to publish...");
    console.log("Address:", values.address);

    walletClient.data
      ?.writeContract({
        account: account.address,
        abi: certifyAbi,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        functionName: "giveRightToPublish",
        args: [values.address, values.username],
      })
      .then((result) => {
        console.log("Result:", result);

        giveRightToPublishForm.reset();
      })
      .catch((error) => {
        console.error("Error:", error);
        giveRightToPublishForm.setError("root", {
          type: "manual",
          message: "An error occurred.",
        });
      });
  }

  function onSubmitRevokeRightToPublish(
    values: z.infer<typeof formSchemaRevokeRightToPublish>
  ) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    console.log("Revoking right to publish...");
    console.log("Address:", values.address);

    walletClient.data
      ?.writeContract({
        account: account.address,
        abi: certifyAbi,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        functionName: "revokePublisher",
        args: [values.address],
      })
      .then((result) => {
        console.log("Result:", result);

        revokeRightToPublishForm.reset();
      })
      .catch((error) => {
        console.error("Error:", error);
        revokeRightToPublishForm.setError("root", {
          type: "manual",
          message: "An error occurred.",
        });
      });
  }

  return (
    <div className="flex flex-1 items-center justify-evenly">
      <Card>
        <CardHeader>
          <CardTitle>Give right to publish!</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...giveRightToPublishForm}>
            <form
              onSubmit={giveRightToPublishForm.handleSubmit(
                onSubmitGiveRightToPublish
              )}
              className="flex flex-col gap-4"
            >
              <FormField
                control={giveRightToPublishForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The address of the user you want to give the right to
                      publish.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={giveRightToPublishForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The username of the user you want to give the right to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Give Right</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revoke the right to publish!</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...revokeRightToPublishForm}>
            <form
              onSubmit={revokeRightToPublishForm.handleSubmit(
                onSubmitRevokeRightToPublish
              )}
              className="flex flex-col gap-4"
            >
              <FormField
                control={revokeRightToPublishForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The address of the user you want to give the right to
                      publish.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Revoke Right</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
