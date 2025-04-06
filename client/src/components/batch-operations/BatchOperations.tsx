import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface Field {
  id: string;
  label: string;
}

interface BatchOperationsProps {
  title: string;
  description: string;
  entity: string;
  templateColumns: Record<string, string>;
  existingData: any[];
  fields: Field[];
  onBatchCreate: (data: any[]) => Promise<void>;
  onBatchUpdate: (data: any[]) => Promise<void>;
  onBatchDelete: (ids: number[]) => Promise<void>;
  onBatchRecode: (fieldId: string, newValue: string, ids: number[]) => Promise<void>;
}

interface BatchItem {
  id?: number;
  [key: string]: any;
}

function BatchOperations({
  title,
  description,
  entity,
  templateColumns,
  existingData = [],
  fields,
  onBatchCreate,
  onBatchUpdate,
  onBatchDelete,
  onBatchRecode
}: BatchOperationsProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("create");
  const [batchData, setBatchData] = useState<string>("");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedField, setSelectedField] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterTerm, setFilterTerm] = useState("");
  
  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBatchData(e.target.value);
    
    try {
      // Try to parse as JSON
      if (e.target.value.trim().startsWith('[')) {
        const parsed = JSON.parse(e.target.value);
        if (Array.isArray(parsed)) {
          setBatchItems(parsed);
          return;
        }
      }
      
      // Try to parse as CSV
      const lines = e.target.value.trim().split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        const items = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const item: BatchItem = {};
          headers.forEach((header, index) => {
            item[header] = values[index] || '';
          });
          return item;
        });
        setBatchItems(items);
      } else {
        setBatchItems([]);
      }
    } catch (error) {
      console.error("Error parsing batch data:", error);
      setBatchItems([]);
    }
  };
  
  const handleRowSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredData.map(item => item.id!));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleCreate = async () => {
    if (batchItems.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد بيانات للإنشاء",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBatchCreate(batchItems);
      toast({
        title: "تم إنشاء " + entity + " بنجاح",
        description: "تم إنشاء " + batchItems.length + " من " + entity
      });
      setBatchData("");
      setBatchItems([]);
    } catch (error) {
      console.error("Error in batch create:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء " + entity,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUpdate = async () => {
    if (batchItems.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد بيانات للتحديث",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBatchUpdate(batchItems);
      toast({
        title: "تم تحديث " + entity + " بنجاح",
        description: "تم تحديث " + batchItems.length + " من " + entity
      });
      setBatchData("");
      setBatchItems([]);
    } catch (error) {
      console.error("Error in batch update:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث " + entity,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد " + entity + " للحذف",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBatchDelete(selectedIds);
      toast({
        title: "تم حذف " + entity + " بنجاح",
        description: "تم حذف " + selectedIds.length + " من " + entity
      });
      setSelectedIds([]);
    } catch (error) {
      console.error("Error in batch delete:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف " + entity,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRecode = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد " + entity + " لتغيير البيانات",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedField) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد الحقل",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBatchRecode(selectedField, newValue, selectedIds);
      toast({
        title: "تم تغيير البيانات بنجاح",
        description: "تم تغيير قيمة " + fields.find(f => f.id === selectedField)?.label + " لـ " + selectedIds.length + " من " + entity
      });
      setSelectedIds([]);
      setSelectedField("");
      setNewValue("");
    } catch (error) {
      console.error("Error in batch recode:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير البيانات",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const generateTemplate = () => {
    let template = '';
    const headers = Object.keys(templateColumns).join(',');
    template = headers + '\\n';
    template += Object.values(templateColumns).join(',');
    return template;
  };
  
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(generateTemplate()).then(() => {
      toast({
        title: "تم نسخ القالب",
        description: "تم نسخ القالب إلى الحافظة"
      });
    });
  };
  
  const filteredData = existingData.filter(item => {
    if (!filterTerm) return true;
    
    return Object.entries(item).some(([key, value]) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(filterTerm.toLowerCase());
      }
      if (typeof value === 'number') {
        return value.toString().includes(filterTerm);
      }
      return false;
    });
  });
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" onValueChange={setSelectedTab} value={selectedTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="create">إنشاء</TabsTrigger>
            <TabsTrigger value="update">تحديث</TabsTrigger>
            <TabsTrigger value="delete">حذف</TabsTrigger>
            <TabsTrigger value="recode">تغيير قيم</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">إنشاء {entity} بشكل جماعي</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyTemplate}
                >
                  نسخ القالب
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                يمكنك إدخال البيانات بتنسيق CSV أو JSON. كل سطر يمثل عنصرًا جديدًا.
              </p>
              <Textarea 
                placeholder={`أدخل البيانات هنا...\n${generateTemplate()}`}
                className="min-h-[200px] font-mono"
                value={batchData}
                onChange={handleDataChange}
              />
              
              {batchItems.length > 0 && (
                <div className="rounded border overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(batchItems[0]).map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchItems.map((item, index) => (
                        <TableRow key={index}>
                          {Object.values(item).map((value, i) => (
                            <TableCell key={i}>
                              {value !== null && value !== undefined ? String(value) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="update">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">تحديث {entity} بشكل جماعي</h3>
              <p className="text-sm text-muted-foreground">
                يجب أن تحتوي البيانات على حقل 'id' لتحديد الصفوف المراد تحديثها.
              </p>
              <Textarea 
                placeholder="أدخل البيانات هنا بتنسيق CSV أو JSON. يجب أن تحتوي على حقل 'id'"
                className="min-h-[200px] font-mono"
                value={batchData}
                onChange={handleDataChange}
              />
              
              {batchItems.length > 0 && (
                <div className="rounded border overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(batchItems[0]).map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchItems.map((item, index) => (
                        <TableRow key={index}>
                          {Object.values(item).map((value, i) => (
                            <TableCell key={i}>
                              {value !== null && value !== undefined ? String(value) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="delete">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">حذف {entity} بشكل جماعي</h3>
              <p className="text-sm text-muted-foreground">
                حدد {entity} التي ترغب في حذفها من القائمة أدناه.
              </p>
              
              <div className="flex gap-2 my-2">
                <Input 
                  placeholder="بحث..." 
                  value={filterTerm}
                  onChange={e => setFilterTerm(e.target.value)}
                  className="max-w-[300px]"
                />
              </div>
              
              <div className="rounded border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      {existingData.length > 0 && Object.keys(existingData[0])
                        .filter(key => ['id', 'name', 'code', 'invoiceNumber', 'date', 'total', 'balance'].includes(key))
                        .map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) => handleRowSelect(item.id, !!checked)}
                          />
                        </TableCell>
                        {Object.keys(item)
                          .filter(key => ['id', 'name', 'code', 'invoiceNumber', 'date', 'total', 'balance'].includes(key))
                          .map(key => (
                            <TableCell key={key}>
                              {item[key] !== null && item[key] !== undefined ? String(item[key]) : ''}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  تم تحديد {selectedIds.length} من {existingData.length}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recode">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">تغيير قيم {entity} بشكل جماعي</h3>
              <p className="text-sm text-muted-foreground">
                حدد {entity} والحقل الذي ترغب في تغيير قيمته.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">الحقل</label>
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحقل" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map(field => (
                        <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">القيمة الجديدة</label>
                  <Input 
                    placeholder="ادخل القيمة الجديدة"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 my-2">
                <Input 
                  placeholder="بحث..." 
                  value={filterTerm}
                  onChange={e => setFilterTerm(e.target.value)}
                  className="max-w-[300px]"
                />
              </div>
              
              <div className="rounded border overflow-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      {existingData.length > 0 && Object.keys(existingData[0])
                        .filter(key => ['id', 'name', 'code', 'invoiceNumber', 'date', 'total', 'balance'].includes(key))
                        .map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) => handleRowSelect(item.id, !!checked)}
                          />
                        </TableCell>
                        {Object.keys(item)
                          .filter(key => ['id', 'name', 'code', 'invoiceNumber', 'date', 'total', 'balance'].includes(key))
                          .map(key => (
                            <TableCell key={key}>
                              {item[key] !== null && item[key] !== undefined ? String(item[key]) : ''}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  تم تحديد {selectedIds.length} من {existingData.length}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span>جاري المعالجة...</span>
          </div>
        ) : (
          selectedTab === "create" ? (
            <Button onClick={handleCreate} disabled={batchItems.length === 0}>
              إنشاء {batchItems.length} {entity}
            </Button>
          ) : selectedTab === "update" ? (
            <Button onClick={handleUpdate} disabled={batchItems.length === 0}>
              تحديث {batchItems.length} {entity}
            </Button>
          ) : selectedTab === "delete" ? (
            <Button onClick={handleDelete} variant="destructive" disabled={selectedIds.length === 0}>
              حذف {selectedIds.length} {entity}
            </Button>
          ) : (
            <Button onClick={handleRecode} disabled={selectedIds.length === 0 || !selectedField}>
              تغيير قيم {selectedIds.length} {entity}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}

export default BatchOperations;