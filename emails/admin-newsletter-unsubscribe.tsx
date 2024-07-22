import { Html } from "npm:@react-email/html";
import { Head } from "npm:@react-email/head";
import { Body } from "npm:@react-email/body";
import { Container } from "npm:@react-email/container";
import { Img } from "npm:@react-email/img";
import { Text } from "npm:@react-email/text";
import { Hr } from "npm:@react-email/hr";
import { Link } from "npm:@react-email/link";
import { render } from "npm:@react-email/render";
import style from "./style.tsx";

interface EmailAdminNewsletterUnsubscribeProps {
  email: string;
}

export const EmailAdminNewsletterUnsubscribe = ({
  email,
}: EmailAdminNewsletterUnsubscribeProps) => (
  <Html>
    <Head />
    <Body style={style.body}>
      <Container style={style.container}>
        <Img
          src="https://nn1.dev/logo-email.png"
          width="119"
          height="28"
          alt="NN1 Dev Club Logo"
          style={style.img}
        />
        <Text style={style.text}>Newsletter member unsubscribed ✨</Text>
        <Hr style={style.hr} />
        <Text style={style.text}>
          <strong>Email:</strong>{" "}
          <Link href={`mailto:${email}`} style={style.link}>
            {email}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

EmailAdminNewsletterUnsubscribe.PreviewProps = {
  email: "hey@ho.hi",
} as EmailAdminNewsletterUnsubscribeProps;

const renderEmailAdminNewsletterUnsubscribe = (
  props: EmailAdminNewsletterUnsubscribeProps,
) => ({
  html: render(<EmailAdminNewsletterUnsubscribe {...props} />),
  text: render(<EmailAdminNewsletterUnsubscribe {...props} />, {
    plainText: true,
  }),
});

export default EmailAdminNewsletterUnsubscribe;
export { renderEmailAdminNewsletterUnsubscribe };
