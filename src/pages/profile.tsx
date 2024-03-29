import { withSession } from "@/common/middlewares";
import { api } from "@/common/server/api";
import type { NextPage } from "next";

import { classNames, shortFormatNumber, signIn } from "@/common/lib/utils";
import {
  Button,
  EditProfile,
  Error,
  Feed,
  Loading,
  UserAvatar,
} from "@/components";
import { AppLayout } from "@/layouts";

import { useRouter } from "next/router";
import { motion } from "framer-motion";

import { FiCalendar } from "react-icons/fi";
import { useState } from "react";
import Image from "next/image";

const Profile: NextPage<ProfilePageProps> = ({ user }) => {
  const router = useRouter();
  const following = api.user.following.useMutation({
    onSuccess: () => profile.refetch(),
  });

  const profile = api.profile.useQuery({ userId: router.query.id as string });
  const [isOpen, setOpen] = useState<boolean>(false);

  if (profile.isError) {
    return (
      <AppLayout user={user}>
        <div className="grid h-screen w-full place-content-center">
          <div className="flex flex-col items-center gap-y-8">
            <Error className="h-48 w-48" />
            <div className="w-fit text-3xl font-bold">
              <p>AMIGO YOUR MAMA IS TOO BIG!!!</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (profile.isLoading && profile.data == null) {
    return (
      <AppLayout user={user}>
        <div className="py-16">
          <Loading />
        </div>
      </AppLayout>
    );
  }

  const isUserFollower = profile.data?.followers.some(
    ({ id }) => id === user?.id
  );

  const formattedFollowersNumber = shortFormatNumber(
    profile.data?.followers.length as number
  );
  const formattedFollowingNumber = shortFormatNumber(
    profile.data?.following.length as number
  );

  const commit = (action: "unfollow" | "follow") => {
    following.mutate({
      targetId: profile.data?.id as string,
      action: action,
    });
  };

  const nextLevel = 1_000 + profile.data.level * 100;

  return (
    <AppLayout user={user}>
      <div className="space-y-2">
        <div className="flex flex-col">
          <div className="relative h-32 w-full bg-gray-200 dark:bg-neutral-800">
            {profile.data.banner && (
              <Image
                fill
                alt={profile.data.name?.concat("-banner") ?? ""}
                src={profile.data.banner}
                className="object-cover"
              />
            )}
          </div>
          <div className="-mt-16 inline-flex w-full justify-between px-6">
            <div className="inline-flex w-full items-end justify-between">
              <UserAvatar
                size="lg"
                src={profile.data?.image ?? null}
                className="w-23 ring-6 h-32 w-32 ring-2 ring-sky-600"
              />

              <div className="inline-flex w-1/2 items-center justify-end gap-x-2">
                {user && (
                  <div className="inline-flex flex-1 items-center justify-start gap-x-2">
                    <div className="relative h-2 w-full flex-1 overflow-hidden rounded-full bg-neutral-300 dark:bg-neutral-800">
                      <motion.div
                        className={classNames(
                          "absolute left-0 top-0 h-full bg-sky-500"
                        )}
                        animate={{
                          width: (profile.data.xp / nextLevel) * 100 + "%",
                        }}
                      ></motion.div>
                    </div>

                    <div className="grid h-8 w-8 place-content-center rounded-full bg-sky-500 bg-opacity-10 text-sm font-bold">
                      <span>{profile.data.level}</span>
                    </div>
                  </div>
                )}
                {user && user.id === profile.data.id && (
                  <Button
                    className="w-12 justify-center"
                    intent="secondary"
                    onClick={() => setOpen(true)}
                  >
                    Edit
                  </Button>
                )}
                {profile.data?.id !== user?.id && (
                  <div className="flex flex-col justify-end">
                    {isUserFollower ? (
                      <Button
                        onClick={() =>
                          user ? commit("unfollow") : void signIn()
                        }
                        intent="secondary"
                        className="w-20 justify-center"
                      >
                        Following
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          user ? commit("follow") : void signIn()
                        }
                        className="w-20 justify-center"
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="mt-4">
            <h4 className="text-2xl font-bold">{profile.data?.name}</h4>
            <span className="mt-1 line-clamp-4 font-medium text-gray-600">
              {profile.data?.bio}
            </span>
          </div>
          <div className="my-2 inline-flex items-center justify-start gap-x-2 text-gray-400">
            <FiCalendar />
            <span>
              {new Date(profile.data?.createdAt ?? "").toDateString()}
            </span>
          </div>
          <br />
          <div className="inline-flex justify-between gap-x-4">
            <div className="space-x-2">
              <span className="text-gray-400">followers</span>
              <span className="font-bold">{formattedFollowersNumber}</span>
            </div>
            <div className="space-x-2">
              <span className="text-gray-400">following</span>
              <span className="font-bold">{formattedFollowingNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* <h4 className="mt-16 px-4 font-bold">
        <span>Twats</span>
      </h4> */}
      <Feed filters={{ profileId: profile.data?.id }} />

      <EditProfile user={user} isOpen={isOpen} onClose={() => setOpen(false)} />
    </AppLayout>
  );
};

interface ProfilePageProps {
  user: IUser | null;
}

export const getServerSideProps = withSession(false);
export default Profile;
