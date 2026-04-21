import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
        }}
        className="text-center space-y-6 px-6"
      >
        <h1 className="font-display text-8xl md:text-9xl tracking-wider text-primary">
          404
        </h1>
        <p className="text-lg text-text-muted max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => navigate("/")}
          size="lg"
          icon={<Home size={18} />}
        >
          Go Home
        </Button>
      </motion.div>
    </div>
  );
}
