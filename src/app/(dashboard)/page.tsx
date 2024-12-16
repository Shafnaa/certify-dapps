"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { certifyAbi } from "@/config";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

export default function Page() {
  const [tokenCounter, setTokenCounter] = useState(0);
  const [cardContainer, setCardContainer] = useState<React.ReactNode[]>([]);

  const publicClient = usePublicClient();

  useEffect(() => {
    publicClient
      ?.readContract({
        abi: certifyAbi,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        functionName: "getTokenCounter",
      })
      .then((result) => {
        setTokenCounter(Number(result));
      });
  });

  useEffect(() => {
    // setCardContainer();
    async function getCardCollections() {
      setCardContainer(
        await Promise.all([
          ...Array.from({ length: tokenCounter - 1 }).map((_, index) => {
            return publicClient
              ?.readContract({
                abi: certifyAbi,
                address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                functionName: "tokenURI",
                args: [index + 1],
              })
              .then(
                async (message) => {
                  return publicClient
                    ?.readContract({
                      abi: certifyAbi,
                      address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                      functionName: "ownerOf",
                      args: [index + 1],
                    })
                    .then(
                      (address) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>{String(address)}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{String(message)}</p>
                          </CardContent>
                          <CardFooter>
                            <Link href={`/certificate/${index + 1}`} className="w-full">
                              <Button className="w-full">View</Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      ),
                      (error) => {
                        console.error("Error:", error);
                        return <></>;
                      }
                    );
                },
                (error) => {
                  console.error("Error:", error);
                  return <></>;
                }
              );
          }),
        ])
      );
    }

    getCardCollections();
  }, [tokenCounter]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {cardContainer}

        {/* {Array.from({ length: tokenCounter - 1 }).map((_, index) => {
          return publicClient
            ?.readContract({
              abi: certifyAbi,
              address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
              functionName: "tokenURI",
              args: [index + 1],
            })
            .then(
              async (message) => {
                return publicClient
                  ?.readContract({
                    abi: certifyAbi,
                    address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                    functionName: "ownerOf",
                    args: [index + 1],
                  })
                  .then(
                    (address) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle>{String(address)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{String(message)}</p>
                        </CardContent>
                        <CardFooter>
                          <Link href="/dashboard" className="w-full">
                            <Button className="w-full">View</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ),
                    (error) => {
                      console.error("Error:", error);
                      return <></>;
                    }
                  );
              },
              (error) => {
                console.error("Error:", error);
                return <></>;
              }
            );
        })} */}
      </div>
      {/* <Button
        onClick={() => {
          console.log("Hash message:", keccak256(Buffer.from("hello")));

          wallet.data
            ?.request({
              method: "personal_sign",
              params: [
                keccak256(Buffer.from("hello")),
                wallet.data.account.address,
              ],
            })
            .then((result) => {
              console.log("Signature:", result);
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }}
      >
        Sign Message
      </Button> */}
    </div>
  );
}
