import React from "react";
import { useParams } from "react-router-dom";
import { CreateListingForm } from "./CreerAnnonce";

export default function EditAnnonce() {
  const { id } = useParams();
  return <CreateListingForm editId={id} />;
}
