import { useSetAtom } from "jotai";
import { useState } from "react";
import { BeingBuilt } from "../../components/shell/BeingBuilt/BeingBuilt";
import { Button } from "../../components/ui/Button/Button";
import { logOutAtom } from "../../store/sessionActions";

// Being built. A later part of the redesign replaces this file with the real
// page. Until then Log out lives here for wide screens (AC43); on a phone it
// is also in the menu.
export default function MyProfilePage() {
  const logOut = useSetAtom(logOutAtom);
  const [loggingOut, setLoggingOut] = useState(false);

  // The route guard sends the user to log in when the session is gone, and
  // this page leaves with it. Nothing navigates here.
  function handleLogOut() {
    setLoggingOut(true);
    void logOut();
  }

  return (
    <BeingBuilt heading="My profile" sub="Your account and your alumni profile.">
      <Button busy={loggingOut} onClick={handleLogOut}>
        Log out
      </Button>
    </BeingBuilt>
  );
}
