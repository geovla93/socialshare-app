import {
  useRef,
  useEffect,
  FC,
  Dispatch,
  SetStateAction,
  RefObject,
  ChangeEventHandler,
} from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Dialog, Transition } from "@headlessui/react";
import { XIcon, PhotographIcon } from "@heroicons/react/outline";
import { useForm, useWatch, Controller, SubmitHandler } from "react-hook-form";

import ProfilePic from "../Shared/ProfilePic";
import Button from "../Shared/Button";
import Spinner from "../Shared/Spinner";
import uploadPic from "@/utils/cloudinary";
import useCreatePost from "@/hooks/useCreatePost";

type CreatePostModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  media: File | null;
  setMedia: Dispatch<SetStateAction<File | null>>;
  mediaPreview: string | null;
  setMediaPreview: Dispatch<SetStateAction<string | null>>;
  handleImageChange: ChangeEventHandler<HTMLInputElement>;
  mediaRef: RefObject<HTMLInputElement>;
};

const CreatePostModal: FC<CreatePostModalProps> = ({
  isOpen,
  closeModal,
  media,
  setMedia,
  mediaPreview,
  setMediaPreview,
  handleImageChange,
  mediaRef,
}) => {
  const { data: session } = useSession();
  const mutation = useCreatePost();
  const modalRef = useRef<HTMLInputElement>(null);
  const {
    control,
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful, isSubmitted },
  } = useForm<{ text: string; location: string }>({
    defaultValues: { text: "", location: "" },
  });

  const text = useWatch({ control, name: "text" });

  useEffect(() => {
    if (isSubmitted && isSubmitSuccessful) {
      reset({ text: "", location: "" });
      closeModal();
    }
  }, [closeModal, isSubmitSuccessful, isSubmitted, reset]);

  const handleDeleteMedia = () => {
    setMedia(null);
    setMediaPreview(null);
  };

  const onSubmit: SubmitHandler<{ text: string; location: string }> = async (
    data
  ) => {
    let picUrl;
    if (media !== null) picUrl = await uploadPic(media);
    if (media !== null && !picUrl) {
      return;
    }

    await mutation.mutateAsync({
      data,
      picUrl,
    });

    setMedia(null);
    setMediaPreview(null);
  };

  return (
    <Transition
      appear
      show={isOpen}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog
        initialFocus={modalRef}
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="flex flex-col divide-y divide-gray-300 bg-white shadow rounded w-3/4 md:w-2/3 max-w-screen-sm mx-auto z-50">
            <div className="relative flex items-center justify-center p-3">
              <Dialog.Title>Create Post</Dialog.Title>
              <span
                className="absolute right-2 cursor-pointer rounded-full p-1 hover:bg-blue-500 group transition-colors duration-300 ease-in-out"
                onClick={closeModal}
              >
                <XIcon className="h-8 w-8 text-blue-500 group-hover:text-gray-50 transition-colors duration-300 ease-in-out" />
              </span>
            </div>
            <Dialog.Description
              as="form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col p-6 space-y-4 divide-y divide-gray-300"
            >
              <div className="flex items-center space-x-4">
                <Link href={`/profile/${session?.user.username}`}>
                  <a>
                    {session && (
                      <ProfilePic
                        style="w-10 h-10 cursor-pointer"
                        src={session.user.image}
                        alt={session.user.name}
                      />
                    )}
                  </a>
                </Link>
                <Controller
                  control={control}
                  name="text"
                  rules={{
                    required: "This field is required.",
                    minLength: {
                      value: 1,
                      message: "Comment must be at least 1 character.",
                    },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="flex-1 outline-none rounded-full bg-gray-200 p-2 px-4 hover:bg-gray-300"
                      autoComplete="off"
                      type="text"
                      ref={modalRef}
                      placeholder={`${
                        session?.user.name.split(" ")[0]
                      }, what are you thinking?`}
                    />
                  )}
                />
              </div>
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <input
                    {...field}
                    className="outline-none rounded-full bg-gray-200 p-2 px-4 hover:bg-gray-300"
                    autoComplete="off"
                    type="text"
                    placeholder="Want to add a location?"
                  />
                )}
              />
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={mediaRef}
                name="media"
              />
              {mediaPreview !== null && (
                <div className="relative w-full h-72 overflow-hidden">
                  <div className="border border-blue-500 border-dotted h-full w-full">
                    <img
                      className="h-full w-full object-contain"
                      src={mediaPreview}
                      alt="image preview"
                    />
                  </div>
                  <XIcon
                    className="absolute top-2 right-2 h-6 w-6 text-gray-800 cursor-pointer"
                    onClick={handleDeleteMedia}
                  />
                </div>
              )}
              <div className="pt-2 w-full">
                <div
                  className="flex items-center justify-center space-x-4 p-2 border border-blue-500 hover:bg-blue-500 rounded cursor-pointer transition-colors duration-300 ease-in-out group"
                  onClick={() => mediaRef.current?.click()}
                >
                  <PhotographIcon className="w-6 h-6 text-blue-500 group-hover:text-gray-50 transition-colors duration-300 ease-in-out" />
                  <p className="text-blue-500 group-hover:text-gray-50 transition-colors duration-300 ease-in-out">
                    Upload photo
                  </p>
                </div>
              </div>
              <Button
                style="disabled:cursor-not-allowed"
                type="submit"
                disabled={text === "" || mutation.isLoading}
              >
                {mutation.isLoading ? (
                  <Spinner style="text-white mx-auto" />
                ) : (
                  "Submit"
                )}
              </Button>
            </Dialog.Description>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreatePostModal;
