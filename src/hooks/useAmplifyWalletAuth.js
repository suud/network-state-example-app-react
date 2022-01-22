import { useState, useMemo, useEffect } from "react";
import Amplify, { Auth } from "aws-amplify";

function useAmplifyWalletAuth(awsconfig) {
    const [user, setUser] = useState(undefined);

    // Configure AWS Amplify authentication resource
    const auth = useMemo(() => {
        Amplify.configure(awsconfig);
        return Auth;
    }, [awsconfig]);

    // Get authenticated user
    useEffect(() => {
        auth.currentAuthenticatedUser()
            .then(currentUser => {
                setUser(currentUser);
                console.log("✅ User is authenticated!")
            })
            .catch(err => {
                setUser(undefined);
                console.log("🛑 Error when trying to get current authenticated user:", err);
            });
    }, [auth]);

    // Sign up
    const signUp = (pubKey) => {
        const params = {
            username: pubKey,
            // TODO: create random password
            password: "123abcDEF?",
        };
        return auth.signUp(params);
    }

    const answerAuthChallenge = ({ cognitoUser, signer }) => {
        if (!cognitoUser) {
            console.log("🤔 No cognitoUser given...");
            return;
        }
        if (!cognitoUser.challengeParam || !cognitoUser.challengeParam.loginCode) {
            console.log("🤔 No loginCode given...");
            return;
        }
        if (user) {
            console.log("🤔 User already authenticated...");
            return;
        }

        signer.signMessage(cognitoUser.challengeParam.loginCode)
            .then(answer => {
                auth.sendCustomChallengeAnswer(cognitoUser, answer)
                    .then(authenticatedUser => {
                        setUser(authenticatedUser)
                        console.log("✅ Successfully answered auth challenge!")
                    })
                    .catch(err => console.log("🛑 Error when trying to anwer auth challenge:", err));
            })
            .catch(err => console.log("🛑 Error when trying to sign challenge code:", err));
    }

    // Sign in
    const signIn = ({ pubKey, signer }) => {
        if (!pubKey) {
            console.log("🤔 No pubKey given...");
            return;
        }
        if (!signer) {
            console.log("🤔 No signer given...");
            return;
        }
        if (user) {
            console.log("🤔 User already authenticated...");
            return;
        }

        auth.signIn(pubKey)
            .then(cognitoUser => answerAuthChallenge({ cognitoUser, signer }))
            .catch(err => {
                if (err.code !== "UserNotFoundException") {
                    console.log("🛑 Error when trying to sign in:", err)
                }

                // User does not exist, sign up
                signUp(pubKey)
                    .then(() => {
                        console.log("✅ Successfully signed up!")
                        // User does exist, now
                        // Try to sign in, again
                        auth.signIn(pubKey)
                            .then(cognitoUser => answerAuthChallenge({ cognitoUser, signer }))
                            .catch(err => console.log("🛑 Error when trying to sign in:", err));
                    })
                    .catch(err => console.log("🛑 Error when trying to anwer auth challenge:", err));
            });
    }

    // Sign out
    const signOut = () => {
        setUser(undefined);
        auth.signOut()
            .then(() => console.log("✅ Successfully signed out!"))
            .catch(err => console.log("🛑 Error when trying to sign out:", err));
    };

    return { signIn, signOut, user };
}

export default useAmplifyWalletAuth;