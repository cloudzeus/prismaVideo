'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const companyFormSchema = z.object({
  COMPANY: z.string().min(1, 'Company code is required'),
  LOCKID: z.string().optional(),
  SODTYPE: z.string().optional(),
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  type: z.enum(['client', 'supplier'], {
    required_error: 'Please select a company type',
  }),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logo: z.union([z.string(), z.any()]).optional(),
  // Additional ERP fields
  TRDR: z.string().optional(),
  CODE: z.string().optional(),
  AFM: z.string().optional(),
  IRSDATA: z.string().optional(),
  ZIP: z.string().optional(),
  PHONE01: z.string().optional(),
  PHONE02: z.string().optional(),
  JOBTYPE: z.string().optional(),
  EMAILACC: z.string().email('Invalid accounting email address').optional().or(z.literal('')),
  INSDATE: z.string().optional(),
  UPDDATE: z.string().optional(),
  default: z.boolean(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: {
    id: string;
    COMPANY?: string | null;
    LOCKID?: string | null;
    SODTYPE?: string | null;
    name: string;
    type: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    logo?: string | null;
    // Additional ERP fields
    TRDR?: string | null;
    CODE?: string | null;
    AFM?: string | null;
    IRSDATA?: string | null;
    ZIP?: string | null;
    PHONE01?: string | null;
    PHONE02?: string | null;
    JOBTYPE?: string | null;
    EMAILACC?: string | null;
    INSDATE?: string | null;
    UPDDATE?: string | null;
    default?: boolean | null;
  };
  onSubmit: (data: CompanyFormData & { logo?: any }) => Promise<void>;
  onCancel?: () => void;
}

export function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<any>(null);
  const [isVatLookingUp, setIsVatLookingUp] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      COMPANY: company?.COMPANY || '',
      LOCKID: company?.LOCKID || '',
      SODTYPE: company?.SODTYPE || '',
      name: company?.name || '',
      type: (company?.type as 'client' | 'supplier') || 'client',
      address: company?.address || '',
      city: company?.city || '',
      country: company?.country || 'Greece',
      phone: company?.phone || '',
      email: company?.email || '',
      website: company?.website || '',
      logo: company?.logo || '',
      // Additional ERP fields
      TRDR: company?.TRDR || '',
      CODE: company?.CODE || '',
      AFM: company?.AFM || '',
      IRSDATA: company?.IRSDATA || '',
      ZIP: company?.ZIP || '',
      PHONE01: company?.PHONE01 || '',
      PHONE02: company?.PHONE02 || '',
      JOBTYPE: company?.JOBTYPE || '',
      EMAILACC: company?.EMAILACC || '',
      INSDATE: company?.INSDATE || '',
      UPDDATE: company?.UPDDATE || '',
      default: company?.default || false,
    },
  });

  const handleVatLookup = async () => {
    const vatNumber = form.getValues('AFM');
    
    if (!vatNumber || vatNumber.trim() === '') {
      toast({
        title: 'VAT Number Required',
        description: 'Please enter a VAT number before looking up company details.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVatLookingUp(true);
      
      const response = await fetch('/api/companies/vat-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ AFM: vatNumber.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve company information');
      }

      const data = await response.json();
      
      console.log('VAT lookup response data:', data);
      
      // Update form fields with retrieved data
      const updatedValues = {
        COMPANY: vatNumber.trim(),
        IRSDATA: data.IRSDATA || '',
        JOBTYPE: data.JOBTYPE || '',
        name: data.name || '',
        address: data.address || '',
        ZIP: data.ZIP || '',
        city: data.city || '',
        country: 'Greece', // Set country to Greece for Greek companies
      };
      
      // Get current form values
      const currentValues = form.getValues();
      
      // Merge current values with updated values
      const mergedValues = { ...currentValues, ...updatedValues };
      
      // Reset form with merged values to ensure all fields update
      form.reset(mergedValues);
      
      // Force form to re-render and validate
      await form.trigger();
      
      console.log('Form values after update:', {
        COMPANY: form.getValues('COMPANY'),
        IRSDATA: form.getValues('IRSDATA'),
        JOBTYPE: form.getValues('JOBTYPE'),
        name: form.getValues('name'),
        address: form.getValues('address'),
        ZIP: form.getValues('ZIP'),
        city: form.getValues('city'),
        country: form.getValues('country'),
      });
      
      console.log('Updated values object:', updatedValues);
      
      toast({
        title: 'Company Information Retrieved',
        description: 'Company details have been automatically filled from the Greek government database.',
      });
    } catch (error) {
      console.error('VAT lookup error:', error);
      toast({
        title: 'Lookup Failed',
        description: 'Failed to retrieve company information. Please check the VAT number and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVatLookingUp(false);
    }
  };

  const handleSubmit = async (data: CompanyFormData) => {
    console.log('Form submit handler called with data:', data)
    console.log('Form validation passed!')
    
    try {
      setIsSubmitting(true)
      
      // Automatically set SODTYPE based on company type
      const formData = {
        ...data,
        SODTYPE: data.type === 'client' ? '13' : '12',
        LOCKID: '', // Hidden field, set to empty string
      }
      
      console.log('Form data being submitted:', formData)
      
      await onSubmit({ ...formData, logo: logoFile || undefined })
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full h-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 h-full">
          <Tabs defaultValue="basic" className="w-full h-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted p-1 rounded-lg">
              <TabsTrigger 
                value="basic" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                BASIC INFO
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                CONTACT & ADDRESS
              </TabsTrigger>
              <TabsTrigger 
                value="erp" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                ERP DETAILS
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                ADVANCED
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="COMPANY"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">COMPANY CODE *</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER COMPANY CODE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">COMPANY NAME *</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER COMPANY NAME" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase font-semibold">COMPANY TYPE *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'client'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="SELECT COMPANY TYPE" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="client">CLIENT</SelectItem>
                        <SelectItem value="supplier">SUPPLIER</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="AFM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">VAT NUMBER (AFM)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="ENTER VAT NUMBER" {...field} />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleVatLookup}
                            disabled={isVatLookingUp}
                            className="shrink-0"
                          >
                            {isVatLookingUp ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="IRSDATA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">IRS TAX OFFICE</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER IRS TAX OFFICE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase font-semibold">ADDRESS</FormLabel>
                    <FormControl>
                      <Textarea placeholder="ENTER COMPANY ADDRESS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">CITY</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER CITY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">COUNTRY</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'Greece'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="SELECT COUNTRY" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Greece">GREECE</SelectItem>
                          <SelectItem value="USA">USA</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                          <SelectItem value="Germany">GERMANY</SelectItem>
                          <SelectItem value="France">FRANCE</SelectItem>
                          <SelectItem value="Italy">ITALY</SelectItem>
                          <SelectItem value="Spain">SPAIN</SelectItem>
                          <SelectItem value="Netherlands">NETHERLANDS</SelectItem>
                          <SelectItem value="Belgium">BELGIUM</SelectItem>
                          <SelectItem value="Switzerland">SWITZERLAND</SelectItem>
                          <SelectItem value="Austria">AUSTRIA</SelectItem>
                          <SelectItem value="Sweden">SWEDEN</SelectItem>
                          <SelectItem value="Norway">NORWAY</SelectItem>
                          <SelectItem value="Denmark">DENMARK</SelectItem>
                          <SelectItem value="Finland">FINLAND</SelectItem>
                          <SelectItem value="Poland">POLAND</SelectItem>
                          <SelectItem value="Czech Republic">CZECH REPUBLIC</SelectItem>
                          <SelectItem value="Hungary">HUNGARY</SelectItem>
                          <SelectItem value="Romania">ROMANIA</SelectItem>
                          <SelectItem value="Bulgaria">BULGARIA</SelectItem>
                          <SelectItem value="Croatia">CROATIA</SelectItem>
                          <SelectItem value="Slovenia">SLOVENIA</SelectItem>
                          <SelectItem value="Slovakia">SLOVAKIA</SelectItem>
                          <SelectItem value="Lithuania">LITHUANIA</SelectItem>
                          <SelectItem value="Latvia">LATVIA</SelectItem>
                          <SelectItem value="Estonia">ESTONIA</SelectItem>
                          <SelectItem value="Cyprus">CYPRUS</SelectItem>
                          <SelectItem value="Malta">MALTA</SelectItem>
                          <SelectItem value="Luxembourg">LUXEMBOURG</SelectItem>
                          <SelectItem value="Ireland">IRELAND</SelectItem>
                          <SelectItem value="Portugal">PORTUGAL</SelectItem>
                          <SelectItem value="Canada">CANADA</SelectItem>
                          <SelectItem value="Australia">AUSTRALIA</SelectItem>
                          <SelectItem value="New Zealand">NEW ZEALAND</SelectItem>
                          <SelectItem value="Japan">JAPAN</SelectItem>
                          <SelectItem value="South Korea">SOUTH KOREA</SelectItem>
                          <SelectItem value="China">CHINA</SelectItem>
                          <SelectItem value="India">INDIA</SelectItem>
                          <SelectItem value="Brazil">BRAZIL</SelectItem>
                          <SelectItem value="Argentina">ARGENTINA</SelectItem>
                          <SelectItem value="Mexico">MEXICO</SelectItem>
                          <SelectItem value="South Africa">SOUTH AFRICA</SelectItem>
                          <SelectItem value="Turkey">TURKEY</SelectItem>
                          <SelectItem value="Russia">RUSSIA</SelectItem>
                          <SelectItem value="Ukraine">UKRAINE</SelectItem>
                          <SelectItem value="Belarus">BELARUS</SelectItem>
                          <SelectItem value="Moldova">MOLDOVA</SelectItem>
                          <SelectItem value="Georgia">GEORGIA</SelectItem>
                          <SelectItem value="Armenia">ARMENIA</SelectItem>
                          <SelectItem value="Azerbaijan">AZERBAIJAN</SelectItem>
                          <SelectItem value="Kazakhstan">KAZAKHSTAN</SelectItem>
                          <SelectItem value="Uzbekistan">UZBEKISTAN</SelectItem>
                          <SelectItem value="Kyrgyzstan">KYRGYZSTAN</SelectItem>
                          <SelectItem value="Tajikistan">TAJIKISTAN</SelectItem>
                          <SelectItem value="Turkmenistan">TURKMENISTAN</SelectItem>
                          <SelectItem value="Mongolia">MONGOLIA</SelectItem>
                          <SelectItem value="Vietnam">VIETNAM</SelectItem>
                          <SelectItem value="Thailand">THAILAND</SelectItem>
                          <SelectItem value="Malaysia">MALAYSIA</SelectItem>
                          <SelectItem value="Singapore">SINGAPORE</SelectItem>
                          <SelectItem value="Indonesia">INDONESIA</SelectItem>
                          <SelectItem value="Philippines">PHILIPPINES</SelectItem>
                          <SelectItem value="Taiwan">TAIWAN</SelectItem>
                          <SelectItem value="Hong Kong">HONG KONG</SelectItem>
                          <SelectItem value="Macau">MACAU</SelectItem>
                          <SelectItem value="Israel">ISRAEL</SelectItem>
                          <SelectItem value="Lebanon">LEBANON</SelectItem>
                          <SelectItem value="Jordan">JORDAN</SelectItem>
                          <SelectItem value="Syria">SYRIA</SelectItem>
                          <SelectItem value="Iraq">IRAQ</SelectItem>
                          <SelectItem value="Iran">IRAN</SelectItem>
                          <SelectItem value="Afghanistan">AFGHANISTAN</SelectItem>
                          <SelectItem value="Pakistan">PAKISTAN</SelectItem>
                          <SelectItem value="Bangladesh">BANGLADESH</SelectItem>
                          <SelectItem value="Sri Lanka">SRI LANKA</SelectItem>
                          <SelectItem value="Nepal">NEPAL</SelectItem>
                          <SelectItem value="Bhutan">BHUTAN</SelectItem>
                          <SelectItem value="Myanmar">MYANMAR</SelectItem>
                          <SelectItem value="Laos">LAOS</SelectItem>
                          <SelectItem value="Cambodia">CAMBODIA</SelectItem>
                          <SelectItem value="Brunei">BRUNEI</SelectItem>
                          <SelectItem value="East Timor">EAST TIMOR</SelectItem>
                          <SelectItem value="Papua New Guinea">PAPUA NEW GUINEA</SelectItem>
                          <SelectItem value="Fiji">FIJI</SelectItem>
                          <SelectItem value="Vanuatu">VANUATU</SelectItem>
                          <SelectItem value="Solomon Islands">SOLOMON ISLANDS</SelectItem>
                          <SelectItem value="New Caledonia">NEW CALEDONIA</SelectItem>
                          <SelectItem value="French Polynesia">FRENCH POLYNESIA</SelectItem>
                          <SelectItem value="Samoa">SAMOA</SelectItem>
                          <SelectItem value="Tonga">TONGA</SelectItem>
                          <SelectItem value="Kiribati">KIRIBATI</SelectItem>
                          <SelectItem value="Tuvalu">TUVALU</SelectItem>
                          <SelectItem value="Nauru">NAURU</SelectItem>
                          <SelectItem value="Palau">PALAU</SelectItem>
                          <SelectItem value="Marshall Islands">MARSHALL ISLANDS</SelectItem>
                          <SelectItem value="Micronesia">MICRONESIA</SelectItem>
                          <SelectItem value="Northern Mariana Islands">NORTHERN MARIANA ISLANDS</SelectItem>
                          <SelectItem value="Guam">GUAM</SelectItem>
                          <SelectItem value="American Samoa">AMERICAN SAMOA</SelectItem>
                          <SelectItem value="Puerto Rico">PUERTO RICO</SelectItem>
                          <SelectItem value="Virgin Islands">VIRGIN ISLANDS</SelectItem>
                          <SelectItem value="Greenland">GREENLAND</SelectItem>
                          <SelectItem value="Iceland">ICELAND</SelectItem>
                          <SelectItem value="Faroe Islands">FAROE ISLANDS</SelectItem>
                          <SelectItem value="Albania">ALBANIA</SelectItem>
                          <SelectItem value="Bosnia and Herzegovina">BOSNIA AND HERZEGOVINA</SelectItem>
                          <SelectItem value="Montenegro">MONTENEGRO</SelectItem>
                          <SelectItem value="North Macedonia">NORTH MACEDONIA</SelectItem>
                          <SelectItem value="Serbia">SERBIA</SelectItem>
                          <SelectItem value="Kosovo">KOSOVO</SelectItem>
                          <SelectItem value="Vatican City">VATICAN CITY</SelectItem>
                          <SelectItem value="San Marino">SAN MARINO</SelectItem>
                          <SelectItem value="Monaco">MONACO</SelectItem>
                          <SelectItem value="Liechtenstein">LIECHTENSTEIN</SelectItem>
                          <SelectItem value="Andorra">ANDORRA</SelectItem>
                          <SelectItem value="Gibraltar">GIBRALTAR</SelectItem>
                          <SelectItem value="Malta">MALTA</SelectItem>
                          <SelectItem value="Cyprus">CYPRUS</SelectItem>
                          <SelectItem value="Other">OTHER</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="PHONE01"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">PRIMARY PHONE</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER PRIMARY PHONE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="PHONE02"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">SECONDARY PHONE</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER SECONDARY PHONE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">EMAIL</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ENTER EMAIL ADDRESS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="EMAILACC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">ACCOUNTING EMAIL</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ENTER ACCOUNTING EMAIL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase font-semibold">WEBSITE</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="ENTER WEBSITE URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="erp" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="TRDR"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">TRDR (ERP ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER ERP ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="CODE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">ERP CODE</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER ERP CODE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ZIP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">ZIP CODE</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER ZIP CODE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="JOBTYPE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">JOB TYPE</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER JOB TYPE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="INSDATE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">INSERT DATE</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="UPDDATE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">UPDATE DATE</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase font-semibold">COMPANY LOGO</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Handle file upload logic here
                          field.onChange(file.name)
                        }
                      }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base uppercase font-semibold">DEFAULT COMPANY</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Set this company as the default company for the system
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                CANCEL
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {company ? 'UPDATE COMPANY' : 'CREATE COMPANY'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 