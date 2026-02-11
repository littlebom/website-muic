import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Category</h1>
        <p className="text-muted-foreground">Add a new course category</p>
      </div>

      <CategoryForm />
    </div>
  );
}
