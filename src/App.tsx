/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import React, { ReactNode, useEffect, useState } from "react";
import { 
  Leaf, 
  Cake, 
  Utensils, 
  ExternalLink, 
  Sparkles,
  Flame,
  Plus,
  Pencil,
  Bell,
  UserCircle,
  ChevronRight,
  ShieldCheck,
  Thermometer,
  FileText,
  CheckCircle2,
  Trash2,
  LayoutDashboard,
  Settings2,
  Box,
  Users,
  ClipboardList
} from "lucide-react";
import { supabase } from "./lib/supabase";

const BRAND_LOGO_URL =
  "https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fa149df68.%E1%BA%A2nh.173719.jpg";

type AppTab = "checkwwork" | "dashboard" | "operations" | "settings";

const TAB_TO_PATH: Record<AppTab, string> = {
  checkwwork: "/checkwwork",
  dashboard: "/dashboard",
  operations: "/operations",
  settings: "/settings",
};

const getTabFromPath = (pathname: string): AppTab => {
  if (pathname.startsWith("/dashboard")) {
    return "dashboard";
  }
  if (pathname.startsWith("/checkwwork")) {
    return "checkwwork";
  }
  if (pathname.startsWith("/operations")) {
    return "operations";
  }
  if (pathname.startsWith("/settings")) {
    return "settings";
  }
  return "checkwwork";
};

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Cannot convert selected file to Base64."));
    };
    reader.onerror = () => reject(new Error("Cannot read selected image file."));
    reader.readAsDataURL(file);
  });

const getGoogleDriveFileId = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    if (!url.hostname.includes("drive.google.com")) {
      return null;
    }
    const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (filePathMatch?.[1]) {
      return filePathMatch[1];
    }
    const idFromQuery = url.searchParams.get("id");
    return idFromQuery || null;
  } catch {
    return null;
  }
};

const getEmbeddableVideoUrl = (rawUrl: string): string => {
  const driveFileId = getGoogleDriveFileId(rawUrl);
  if (driveFileId) {
    return `https://drive.google.com/file/d/${driveFileId}/preview`;
  }
  return rawUrl;
};

const isIframeVideoSource = (rawUrl: string): boolean => Boolean(getGoogleDriveFileId(rawUrl));

interface MenuItem {
  id: string;
  name: string;
  image: string;
  urgent?: string;
  info?: string;
  videoUrl?: string;
}

interface Category {
  id: string;
  title: string;
  icon: ReactNode;
  color: "primary" | "secondary" | "tertiary";
  items: MenuItem[];
  subHeader?: string;
  specialItems?: MenuItem[];
}

interface DashboardCategoryRow {
  id: string;
  slug: string;
  title: string;
  icon_name: string;
  color: "primary" | "secondary" | "tertiary";
  sort_order: number;
  sub_header: string | null;
}

interface DashboardTaskRow {
  id: string;
  category_id: string;
  task_name: string;
  image_url: string;
  urgent_text: string | null;
  info_text: string | null;
  video_url: string | null;
  is_special: boolean;
  sort_order: number;
}

const getCategoryIcon = (iconName: string) => {
  if (iconName === "Cake") {
    return <Cake className="w-8 h-8 fill-current" />;
  }
  if (iconName === "Utensils") {
    return <Utensils className="w-8 h-8 fill-current" />;
  }
  return <Leaf className="w-8 h-8 fill-current" />;
};

const mapDashboardRowsToCategories = (
  categoryRows: DashboardCategoryRow[],
  taskRows: DashboardTaskRow[]
): Category[] => {
  const tasksByCategoryId = new Map<string, DashboardTaskRow[]>();
  for (const row of taskRows) {
    const currentRows = tasksByCategoryId.get(row.category_id) ?? [];
    currentRows.push(row);
    tasksByCategoryId.set(row.category_id, currentRows);
  }

  return categoryRows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((categoryRow) => {
      const orderedTasks = (tasksByCategoryId.get(categoryRow.id) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      );
      const normalItems = orderedTasks.filter((task) => !task.is_special);
      const specialItems = orderedTasks.filter((task) => task.is_special);
      return {
        id: categoryRow.slug,
        title: categoryRow.title,
        icon: getCategoryIcon(categoryRow.icon_name),
        color: categoryRow.color,
        items: normalItems.map((task) => ({
          id: task.id,
          name: task.task_name,
          image: task.image_url,
          urgent: task.urgent_text ?? undefined,
          info: task.info_text ?? undefined,
          videoUrl: task.video_url ?? undefined,
        })),
        subHeader: categoryRow.sub_header ?? undefined,
        specialItems: specialItems.map((task) => ({
          id: task.id,
          name: task.task_name,
          image: task.image_url,
          urgent: task.urgent_text ?? undefined,
          info: task.info_text ?? undefined,
          videoUrl: task.video_url ?? undefined,
        })),
      } satisfies Category;
    });
};

const DASHBOARD_DATA: Category[] = [
  {
    id: "juice",
    title: "JUICE",
    icon: <Leaf className="w-8 h-8 fill-current" />,
    color: "primary",
    items: [
      { id: "j1", name: "Avocado Juice", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQWxNzQllOAsUNnTA2V-Izmr4YhiWOWtlsqFsnSxVrqfPEU9y66cE__TomW0uXiynio_137GhlWd63ebhCiAFab61AE13P5Axg0f-aDxVb7X8AVd_KcxsaS4ry8EvryFsU-j9fPwAT8lVJRx91uid2JaydBX2bH-har6VzZyKGqPtiPIazKH5g7e7sf89vO8GyifdRjC3htPYR7C7WrVh4cNMjlINo9i1CC0a0_dK7nwC0V-vQmvO8QnVdgZICWp6eSEiAVVjhpw" },
      { id: "j2", name: "Mango Juice", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXBcbie7ne7fFsdNNqyHvoLwPyaKdVmIj2-NYhTUO-62N1FNWLrlrLkw63u2U9JErAE8ao7TuLF4u-RQtTLcfz68XtquZdjtq7k3-DTBE5qwRUrxVseBa2j85NpAmVSMajb2sPORDuQHe7ZLW3LUsEHBO3sE6BB0hFGW6AyyCeTsf1VI9_KQcWBGNwAJdGo1dFOyoYdloGJjNfUOc_06yoMxlknhh21TR_U1SREBa9-N5mT-1CxMg4HD1Ir8hPmmGyw2Lue_TSfA" },
      { id: "j3", name: "Strawberry Juice", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDW8_whyhmA9E8g25rIwixG6zAwhn-46l39f2ChF6zWCs_I-bpgpEIozc0xMAqCUbnNRYdijkcvzh7SArmDSgkC139J7omeERxwpzXAiKCCAsnDvy9EAup8KhnL3e39pcC67GvNgH_oLrLuAtPQjD1enBqewZwI2aBPPMWHOuEo7JHzrRDJ7pOhq4jMRFPtOMdw-DGcJ7FafWwFpk3QLDsx2xDv30BCMnOf7vLBzTszdLF09n6wwMfUi2OBg88uiULj8MsO5mZrpg" },
      { id: "j4", name: "Cantaloupe Juice", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlIP-zexuPbBBsOf1T1Fw2vDd5mXTxLoB-nzyb83jPXahKJb6aTeU0rXANGXouvbdCeH8g2tp-piBUddANvde1eXCQ_3z9AMGAiTm0CiaKji1S2KTkXO7758GxvsUWyc1g6EqoSHFvDAxcHtn1v2cikgDwv7wrC1RcpttqTZvjG6Zk0xdVgGT2bhLaRJepIahVSi0PlaIYzZLHS75uzVAUJd_ySnZ6-cwymU_21HfXcwsa5lBV_8eTbvs_x_HW-Ok8opNf2xAwXQ" },
      { id: "j5", name: "Watermelon Juice", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCT8JakLlmOX-MLAPHFCMCXhiWBgpmCYjf3VBIVX6qrczW1wailV0G74QmsuhNAbcZwCO8bct9dS8jflpKyIN1Re9Ax17m1ALQ93MhR-k4YNCVERvHjyZMcge4_w0aGQWWucKEYhXxe4Ho2DF8wEen3Z7jzCjxrwLSokpPVhdniEaKs6p7ITi7WVKANNg5cPH6z-o-SWwk-E7Nd03xEh-wHnSb0_qRJQ5p2lsLnmX2AO7ELLGMPJQOed8VLtObDZ7klF0DW6Lszmw" },
      { id: "j6", name: "Mango Sorbet", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBDP51Q6YBr9a1nV0u708MMy1GgAhhUb4eTtNaoEvlJk0AVwR51YlsdHmbXJDnR2vf3NQ1WZWhZeJuvqL_pB_GOjTyX8JhjpQ0Yg-GgL41y0rDiixrlPiluRQohVvU6fRBosSGOIj0mxDdxpizOtfoXusXjM4d3OdZPjk7okAv2yfX5-oESasjoMhi7z-EZ6SSbRjLEKViWhER8gIePKBA2V5iVymInea84Uo7Bo-D-GGssJZNLFn2vhvCN1LD9OaxVZUISvx2xw" },
    ]
  },
  {
    id: "sweet",
    title: "SWEET",
    icon: <Cake className="w-8 h-8 fill-current" />,
    color: "secondary",
    items: [
      { id: "s1", name: "Pancake mix", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrCv-1AsaQ2-JST7jHj9DsmtoYp5ppQzky1TyWEQ3JHpQvNnBhtWqfUhzbwvKsuMQLo5YS6_CwT4BmkmN8QH-ZEUDx5gvJ3hFqkMqHqp3c1pgq4W6C21T3vlEnCihSV4IkbkASJk7fqKOI0n2cyD87M-USu-clGHl6adQjj18r6gERNig2oRUcFPRPqRs1O5WywKK5cNke-VWibyPHH7qfNdVa-ENPdyquXfR1YdO_APxBbmVtJ4fKDN7hVZuHxbx1PXRtMABM0Q" },
      { id: "s2", name: "Crepe mix", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCqUDyigRML7cjqJ8CfV8G88Rx5-KlH4rSCqb0dwBqFHA23dumzIoNdqy8dhcPkeFaN-cimDsECyeVwrrjgtg33aCsFVK3on-L9GdFkDX6zLVNpYodk2lcT1cD6kyNlbja78YNlR-enidrE5wpo19W5EAJFdNYg71wZM_9R2UE0PHfYJYZf03dDWDbpNzUkDIu6_fq8r_Ojt82vlTi0QzndUprFANEZV9h4Ju6zElbFQSRh4ANVjHqigeaDy3n1nsc7XOohpj01g" },
      { id: "s3", name: "Pillow Cake", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEQRVArnqRMvLs-YE0aaeIsOS0jMD4kDh0jf-4ffnMKn_XnErLmbanQgqTgx4sg1hZ1L9jA5fCZzsFjoI6ofzjuG1qD7KdzZANCZtfaNGGDlEvwrI_j3ye7ZV0XWT0gHXCX8kI9ab3GV-xds2JvNy2Um_FYStz3UMwpXX-cZ8cINpzfFoB9p1DsGl3AFWd6mqzaBakaQltizV6Z6mp14uYaa9GApStdRUuNeE3Yz26GcHSbtVyrMlhr8MytEs99UO-o-rYzGoS2A" },
      { id: "s4", name: "Pistachio sauce", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTCClB5riSArdJnoluPxR650tJP1USC87QFLLIHCulduJcbhAmQRDhVlfGOcX1lnMq7XAbuTL1I6Asi4WjpThRjh-ypr7pj2nDRHqToeX-jwtXkevITdjQurQxIleo1dSOQ3CxlKxec9VJM2MgY9dsYuM367kf1NcPuaaErY1y2ag0lMn907YFFNrsWlTtPYMmdYYMkGmlirib8CYG0mUu-HTU_ZlufQpLIFNndINtXZwFwzfvssLS4pGv0mz4O-AY_cxyTgv9Ew" },
      { id: "s5", name: "Fettuccini Cake", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGFb1GjNFrMED1VgqKIza8ptlXZNvS4jXkyE5EqTjRv7h4XQ2QBm9UFNz38KtbAgbzR0lljM7uAYiBhosdH5O9K7DJhMAkMSqsOA6NZxQuNigloWTzU11qIrlWxKu2_DbVz6zQbXdAqZr_EK_Kp6jtogugvhBQ9d3tExzsAdjG4nKViZ_U7Mu-shQnscfhIyjGFTewsBzePfFJlULHVOOdg62isC-pYUop5wh10F2mJGIisLlYZ6MstH_YuOIMhw_MIce1Sp4pbw" },
      { id: "s6", name: "Ice Cream", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ539kmSrRwAnEsdssNqyDHWrujyvpVLHCCh-pmHcOTF_Ge2P-2W-pUpGQ0fFQOG0J9_dB3VpcAzQ9S6CbbepuE-qkUJy2NBy4o3bxlv9jIBCFILawI2300XTSGASZTrST0LiagNvq0nUtCDNK5RjQv6LJLtkZIV9lj7wwPfNxHNpo5QiTXiWVgRdQfuhIky5GDxYORcEOmtp1PjpBA_1saTRlC4ac4nVh_TJIkyqLayY-r1M0hzpi26RToiiDv99ATlZlAecJQA" },
    ]
  },
  {
    id: "dine",
    title: "DINE-IN",
    icon: <Utensils className="w-8 h-8 fill-current" />,
    color: "tertiary",
    items: [
      { id: "d1", name: "Drink water, please!!!", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlnanJDzczek8_DJOc3Z50NGBXjpAg3me1X5FfWC-ywkDDSn0xuktgI7jDdjKd4t17mhbABEDPI8rAmm-iTeI39DfukHVDN9Hyi_F9NYpoTXl-XRzYom6YGDSTM65HX-Abltzlb0m9ecHHtnsY0Ew9PpDSOcFw7aoxDzvshE3CfVMTaE58By64FVH7TT-McEYKAgM6mS6BlxNx5GCxxDvPezpUc88wB--W1Ph0u6N7WvGdK21yfiLbknx8kDWyXcRydv3FIjPXlQ" },
      { id: "d2", name: "Silverware Check", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAANZ_QkYBP3btdW72emKU99365hrk71azu_44wkns0tm1J6XhwB67PSGfjHCwAv3Vv9iUPjsoiMjNBvmU0r9J6DnTJBAbu51Y2Ap4zjSo8pT9yACHLd2N8dT7F831DDhrVZJbOQyI-eX2WL4mZQ_xigCmcWXe2FZM79dJO8al132hVU27yknq2stwk-3kMFTLstjq9gfVPtXysil9dyU7uKTgqnb4LjBFXUXL7i3F8h4ZRm2UCuCzJy3ZqPc01_7xsLBPIb-bo0A" },
      { id: "d3", name: "Table Sanitation", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDN2dcng65o4boZnV1H60rmMP0kizrt4byGM86yqjkgLbJ3_XQr3PixnCWxja9Pm7y7bmQtg_l1yrimkuyg600423MdjgnW08_DhLZgAdatSwOHRfXruNnA1eehdhdxPwFxlMS_vTR0OjYYZBiXcfCUDmCGIh7tErvtI9xJhqABsVaV2QPR8JM2B5Bd7Q2qTXb96WPaagr8T8KsCEhmsHQtHWAT3IkeJA_FeRMuH2tHzFcG4VUj9jLq8-fGKHDFQEmW7WhiSdFmDw" },
      { id: "d4", name: "Menu Updates", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwX9pNZTpbr6Ne-1_AcCttepB8yWas4RJCJbjfQdXNI1GpOgXNkdEkHQ_YMeN_cLhPErk3tw_F5izmC1hyEDyusXItF1CnYzTKVfm5QOmluhSqsHZ5Xmdz4IovadBBqwehymMe1XAlr7hfweCaY3q-axjE1-9TxatxKJlCiYf051LLpKmRhKxJRvEI6SIPNs8Ko6gCijZsvR1Xl5HZi5zhCxT7ps5IdGkGmii5tZRRYf7nt247ReZvBhsWFf0UZy2hLg8vtfD96A" },
      { id: "d5", name: "Daily Log Completed", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3EksEHr650-f-O47Z967X3MWAuo0p2HP9RBq9qSyPuJpYH5RaOezEy_bLQm7c1xHrV7nmdhe3K7XEybgPNM7d9lcTWFJIj7Kiy7pe18qthwqm9JIO2wEu3bhW7OzRvo3CxMfF5JQuCeg7fAl3Ejep9gaxjJGoI2Ee4Eb2LXa2w9VuVnocnIfr0xwKuZm3bqo5SpoYBKJz_KHFUEBLJJxTkaVm3x24kHUq5trfiTEqmT0A-cx3MjwgkVLfcPn54Fw35enUeF-sbQ" },
    ],
    subHeader: "Equipment Checks",
    specialItems: [
      { id: "e1", name: "Coffee Machine Water", urgent: "Urgent Refill", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgBaT-U9hw_Tz_Cfsb3iQPwEM0BZRymb7q44Jv1v7BMXOvPQ0STlR5HoYgqko3ENoz98w4CpOEY63sA2WmwyPDXbtA7fJPVA7KWrBXmKf4D2vPzDsJOfZKVB3RJ9hukw5ellY2rvrJQqFetrk3X_NR_ezE-8WwLqWJfOYu-nA8n6071kfFQKg5Xcg7DGeUzGpQ5Jcqp5WlKwWjiWv2XdXLmKMQaka-uTd6qsA6dz1Yg5KjdOrkWN3Lx15IIB4qByOK9ASBaw-9Qg" },
      { id: "e2", name: "Refill Choc Fountains", info: "Temp: 45°C", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAycMVLrkM3rkfXXIbL_E2Dgb1vZhyMyO5CWwhDhSxuflt2bwkETItD2HNMCgqrk3zLG-gIooOCFzkyb0E_krxAhrn01YlGiJKUTxPhZUzax0V8o-_cls9bOPNWAZ0EQqaDWUcQFC57FCNo9ePfhAjaz1uVBle7ruscXBb3XQSS9x0s-IlpTDR44F9bbH7_i16c_weBtPoOLZRvYlJ7ElVY8IXefAH97805Uus_lWh2HGl_-rjWw44EoQCBWggYvlsc3fc0vau2Yg" },
    ]
  }
];

interface TaskCardProps {
  key?: React.Key;
  item: MenuItem;
  color: "primary" | "secondary" | "tertiary";
  index: number;
  isEditing?: boolean;
  isSelected?: boolean;
  onToggleSelected?: (itemId: string) => void;
  onEdit?: (item: MenuItem) => void;
  onOpenVideo?: (item: MenuItem) => void;
}

const TaskCard = ({
  item,
  color,
  index,
  isEditing = false,
  isSelected = false,
  onToggleSelected,
  onEdit,
  onOpenVideo,
}: TaskCardProps) => {
  const handleCardClick = () => {
    if (isEditing) {
      onEdit?.(item);
      return;
    }
    onToggleSelected?.(item.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      className={`group flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95 ${
        isSelected ? "bg-primary-main border-primary-main" : "bg-white border-gray-100"
      }`}
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden rounded-xl w-20 h-20 flex-shrink-0">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-lg leading-tight truncate ${isSelected ? "text-white" : "text-gray-900"}`}>
          {item.name}
        </h3>
        {item.urgent && (
          <p
            className={`text-sm font-bold mt-1 animate-pulse flex items-center gap-1 ${
              isSelected ? "text-white/90" : "text-tertiary-main"
            }`}
          >
            <Flame className="w-3 h-3" /> {item.urgent}
          </p>
        )}
        {item.info && (
          <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${isSelected ? "text-white/90" : "text-gray-500"}`}>
            <Sparkles className={`w-3 h-3 ${isSelected ? "text-white" : "text-secondary-main"}`} /> {item.info}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (isEditing) {
            onEdit?.(item);
            return;
          }
          if (item.videoUrl) {
            onOpenVideo?.(item);
          }
        }}
        disabled={!isEditing && !item.videoUrl}
        className={`p-2 rounded-full transition-colors ${
          isEditing
            ? isSelected
              ? "bg-white/15 text-white"
              : "bg-gray-50 text-gray-400 group-hover:text-current"
            : item.videoUrl
              ? "bg-primary-main text-white hover:bg-primary-main/90"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
        } ${isEditing ? "hover:scale-105" : "px-3 py-2 text-sm font-bold"}`}
        aria-label={isEditing ? "Edit task" : item.videoUrl ? "Watch video" : "No video link"}
      >
        {isEditing ? (
          <Pencil className="w-5 h-5 text-primary-main" />
        ) : (
          <span className="inline-flex items-center gap-1">
            <ExternalLink className="w-4 h-4" />
            View
          </span>
        )}
      </button>
    </motion.div>
  );
};

interface CategoryColumnProps {
  key?: React.Key;
  category: Category;
  isEditing?: boolean;
  selectedItemIds?: string[];
  onToggleTaskSelected?: (itemId: string) => void;
  onEditTask?: (item: MenuItem) => void;
  onOpenTaskVideo?: (item: MenuItem) => void;
}

const CategoryColumn = ({
  category,
  isEditing = false,
  selectedItemIds = [],
  onToggleTaskSelected,
  onEditTask,
  onOpenTaskVideo,
}: CategoryColumnProps) => {
  const headerColors = {
    primary: "bg-primary-main",
    secondary: "bg-secondary-main",
    tertiary: "bg-tertiary-main",
  };

  return (
    <section className="flex flex-col h-full bg-white border-r border-gray-100 last:border-r-0">
      <div className={`${headerColors[category.color]} text-white py-6 px-6 flex items-center justify-center gap-3 shadow-md sticky top-0 z-10`}>
        {category.icon}
        <h2 className="font-display uppercase tracking-widest text-2xl font-extrabold">{category.title}</h2>
      </div>
      
      <div className="flex-1 p-5 space-y-4 overflow-y-auto scrollbar-hide bg-surface-container-low/30">
        <AnimatePresence mode="popLayout">
          {category.items.map((item, idx) => (
            <TaskCard
              key={item.id}
              item={item}
              color={category.color}
              index={idx}
              isEditing={isEditing}
              isSelected={selectedItemIds.includes(item.id)}
              onToggleSelected={onToggleTaskSelected}
              onEdit={onEditTask}
              onOpenVideo={onOpenTaskVideo}
            />
          ))}
          
          {category.subHeader && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-6 pb-2"
            >
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] text-center mb-4 ${
                category.color === "tertiary" ? "text-tertiary-main" : "text-gray-400"
              }`}>
                {category.subHeader}
              </h4>
              <div className="space-y-4">
                {category.specialItems?.map((item, idx) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    color={category.color}
                    index={idx + category.items.length}
                    isEditing={isEditing}
                    isSelected={selectedItemIds.includes(item.id)}
                    onToggleSelected={onToggleTaskSelected}
                    onEdit={onEditTask}
                    onOpenVideo={onOpenTaskVideo}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

type WorkTask = {
  id: string;
  icon: "sparkles" | "shield" | "box" | "thermometer" | "file";
  label: string;
  color: string;
  bg: string;
};

type ChecklistTemplateRow = {
  id: string;
  shift: "opening" | "closing";
  task_label: string;
  icon_name: string | null;
  color_class: string | null;
  bg_class: string | null;
  sort_order: number;
  is_active: boolean;
};

type ChecklistCompletionRow = {
  id: string;
  shift: "opening" | "closing";
  task_label: string;
  completed_at: string;
};

type DoneTask = {
  id: string;
  label: string;
  date: string;
  time: string;
};

const renderWorkTaskIcon = (icon: WorkTask["icon"]) => {
  if (icon === "shield") {
    return <ShieldCheck className="w-5 h-5" />;
  }
  if (icon === "box") {
    return <Box className="w-5 h-5" />;
  }
  if (icon === "thermometer") {
    return <Thermometer className="w-5 h-5" />;
  }
  if (icon === "file") {
    return <FileText className="w-5 h-5" />;
  }
  return <Sparkles className="w-5 h-5" />;
};

const mapIconNameToWorkTaskIcon = (iconName: string | null): WorkTask["icon"] => {
  if (iconName === "ShieldCheck") {
    return "shield";
  }
  if (iconName === "Box") {
    return "box";
  }
  if (iconName === "Thermometer") {
    return "thermometer";
  }
  if (iconName === "FileText") {
    return "file";
  }
  return "sparkles";
};

const formatDateForDoneTask = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getNowDoneDateTime = () => {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
};

const getTodayDoneDateLabel = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const toDateKeyLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateKeyToLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DailyReportDashboard = () => {
  const [templateRows, setTemplateRows] = useState<ChecklistTemplateRow[]>([]);
  const [completionRows, setCompletionRows] = useState<ChecklistCompletionRow[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadReportData = async () => {
      const [{ data: templates, error: templatesError }, { data: completions, error: completionsError }] =
        await Promise.all([
          supabase
            .from("checklist_templates")
            .select("id,shift,task_label,icon_name,color_class,bg_class,sort_order,is_active")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("checklist_completions")
            .select("id,shift,task_label,completed_at")
            .order("completed_at", { ascending: false }),
        ]);

      if (!mounted || templatesError || completionsError || !templates || !completions) {
        return;
      }

      setTemplateRows(templates as ChecklistTemplateRow[]);
      setCompletionRows(completions as ChecklistCompletionRow[]);
    };

    loadReportData().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCompletions = completionRows.filter((row) => {
    const completedDateKey = toDateKeyLocal(new Date(row.completed_at));
    if (fromDate && completedDateKey < fromDate) {
      return false;
    }
    if (toDate && completedDateKey > toDate) {
      return false;
    }
    return true;
  });

  const completionsByDate = new Map<string, ChecklistCompletionRow[]>();
  for (const row of filteredCompletions) {
    const dateKey = toDateKeyLocal(new Date(row.completed_at));
    const currentRows = completionsByDate.get(dateKey) ?? [];
    currentRows.push(row);
    completionsByDate.set(dateKey, currentRows);
  }

  const dateCards = Array.from(completionsByDate.keys())
    .sort((a, b) => b.localeCompare(a))
    .map((dateKey) => {
      const rows = completionsByDate.get(dateKey) ?? [];
      const doneLabelsByShift = {
        opening: new Set(rows.filter((row) => row.shift === "opening").map((row) => row.task_label)),
        closing: new Set(rows.filter((row) => row.shift === "closing").map((row) => row.task_label)),
      };
      const totalOpening = templateRows.filter((row) => row.shift === "opening").length;
      const totalClosing = templateRows.filter((row) => row.shift === "closing").length;
      const doneOpening = doneLabelsByShift.opening.size;
      const doneClosing = doneLabelsByShift.closing.size;
      const totalTasks = totalOpening + totalClosing;
      const totalDone = doneOpening + doneClosing;
      const completionPercent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
      const openingPercent = totalOpening > 0 ? Math.round((doneOpening / totalOpening) * 100) : 0;
      const closingPercent = totalClosing > 0 ? Math.round((doneClosing / totalClosing) * 100) : 0;
      return {
        dateKey,
        label: formatDateKeyToLabel(dateKey),
        doneOpening,
        totalOpening,
        doneClosing,
        totalClosing,
        totalDone,
        totalTasks,
        completionPercent,
        openingPercent,
        closingPercent,
      };
    });

  useEffect(() => {
    if (!selectedDateKey && dateCards.length > 0) {
      setSelectedDateKey(dateCards[0].dateKey);
      return;
    }
    if (selectedDateKey && !dateCards.some((card) => card.dateKey === selectedDateKey)) {
      setSelectedDateKey(dateCards[0]?.dateKey ?? null);
    }
  }, [dateCards, selectedDateKey]);

  const selectedCard = dateCards.find((card) => card.dateKey === selectedDateKey) ?? null;
  const selectedRows = selectedDateKey ? completionsByDate.get(selectedDateKey) ?? [] : [];
  const doneByShift = {
    opening: new Set(selectedRows.filter((row) => row.shift === "opening").map((row) => row.task_label)),
    closing: new Set(selectedRows.filter((row) => row.shift === "closing").map((row) => row.task_label)),
  };
  const openingTemplates = templateRows.filter((row) => row.shift === "opening").map((row) => row.task_label);
  const closingTemplates = templateRows.filter((row) => row.shift === "closing").map((row) => row.task_label);
  const openingPending = openingTemplates.filter((label) => !doneByShift.opening.has(label));
  const closingPending = closingTemplates.filter((label) => !doneByShift.closing.has(label));

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white scrollbar-hide">
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-on-background mb-2">Dashboard</h1>
            <p className="text-gray-500 font-medium">Daily work progress report.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              From date
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2"
              />
            </label>
            <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              To date
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2"
              />
            </label>
          </div>
        </div>

        <section className="rounded-2xl border border-primary-main/20 bg-primary-main/5 p-5 space-y-4">
          <h2 className="text-xl font-bold text-primary-main">Daily cards (% completed)</h2>
          {dateCards.length === 0 ? (
            <p className="text-gray-500">No data found for the selected date range.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dateCards.map((card) => (
                <button
                  key={card.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(card.dateKey)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    selectedDateKey === card.dateKey
                      ? "border-primary-main bg-white shadow-sm"
                      : "border-gray-200 bg-white hover:border-primary-main/40"
                  }`}
                >
                  <p className="text-sm font-bold text-gray-800">{card.label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-600">
                    Completed {card.totalDone}/{card.totalTasks} tasks
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-green-50 border border-green-200 px-2 py-2">
                      <p className="text-[11px] font-bold text-green-700 uppercase">Opening</p>
                      <p className="text-lg font-extrabold text-green-800">{card.openingPercent}%</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 border border-orange-200 px-2 py-2">
                      <p className="text-[11px] font-bold text-orange-700 uppercase">Closing</p>
                      <p className="text-lg font-extrabold text-orange-800">{card.closingPercent}%</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">
            Details {selectedCard ? `for ${selectedCard.label}` : ""}
          </h2>
          {selectedCard ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-bold text-green-700">Opening team</p>
                  <p className="text-lg font-extrabold text-green-800">
                    Completed {selectedCard.doneOpening} / {selectedCard.totalOpening}
                  </p>
                  <p className="text-sm text-green-700">
                    Pending {selectedCard.totalOpening - selectedCard.doneOpening}
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-bold text-orange-700">Closing team</p>
                  <p className="text-lg font-extrabold text-orange-800">
                    Completed {selectedCard.doneClosing} / {selectedCard.totalClosing}
                  </p>
                  <p className="text-sm text-orange-700">
                    Pending {selectedCard.totalClosing - selectedCard.doneClosing}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="font-bold text-gray-800 mb-2">Opening - Pending tasks</p>
                  <ul className="space-y-1 text-sm text-gray-600 max-h-64 overflow-y-auto">
                    {openingPending.length > 0 ? (
                      openingPending.map((item) => <li key={item}>- {item}</li>)
                    ) : (
                      <li>- All tasks completed</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="font-bold text-gray-800 mb-2">Closing - Pending tasks</p>
                  <ul className="space-y-1 text-sm text-gray-600 max-h-64 overflow-y-auto">
                    {closingPending.length > 0 ? (
                      closingPending.map((item) => <li key={item}>- {item}</li>)
                    ) : (
                      <li>- All tasks completed</li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Select a day card to view details.</p>
          )}
        </section>
      </div>
    </main>
  );
};

const OperationsDashboard = () => {
  const [closingWorkTasks, setClosingWorkTasks] = useState<WorkTask[]>([
    {
      id: "c1",
      icon: "sparkles",
      label: "Sanitize all prep surfaces and stations",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      id: "c2",
      icon: "shield",
      label: "Secure all dry storage and cold rooms",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      id: "c3",
      icon: "box",
      label: "Complete evening inventory waste log",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ]);
  const [openingWorkTasks, setOpeningWorkTasks] = useState<WorkTask[]>([
    {
      id: "o1",
      icon: "thermometer",
      label: "Check refrigerator & freezer temperatures",
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
    {
      id: "o2",
      icon: "file",
      label: "Review deliveries and invoice validation",
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
  ]);
  const [closingDoneTasks, setClosingDoneTasks] = useState<DoneTask[]>([
    { id: "d1", label: "Empty grease traps & oil disposal", date: "24 May 2024", time: "22:45" },
    { id: "d2", label: "Dishwasher cycle finish & drain", date: "24 May 2024", time: "23:15" },
  ]);
  const [openingDoneTasks, setOpeningDoneTasks] = useState<DoneTask[]>([
    { id: "od1", label: "Unlock staff entry & clock-in", date: "25 May 2024", time: "05:30" },
    { id: "od2", label: "Coffee machine calibration & purge", date: "25 May 2024", time: "06:00" },
  ]);

  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [isAddDoneOpen, setIsAddDoneOpen] = useState(false);
  const [workShift, setWorkShift] = useState<"closing" | "opening">("closing");
  const [workLabel, setWorkLabel] = useState("");
  const [doneShift, setDoneShift] = useState<"closing" | "opening">("closing");
  const [doneLabel, setDoneLabel] = useState("");
  const [doneDate, setDoneDate] = useState("");
  const [doneTime, setDoneTime] = useState("");
  const todayDoneDateLabel = getTodayDoneDateLabel();

  const completedClosingLabelsToday = new Set(
    closingDoneTasks.filter((task) => task.date === todayDoneDateLabel).map((task) => task.label)
  );
  const completedOpeningLabelsToday = new Set(
    openingDoneTasks.filter((task) => task.date === todayDoneDateLabel).map((task) => task.label)
  );

  const visibleClosingWorkTasks = closingWorkTasks.filter(
    (task) => !completedClosingLabelsToday.has(task.label)
  );
  const visibleOpeningWorkTasks = openingWorkTasks.filter(
    (task) => !completedOpeningLabelsToday.has(task.label)
  );
  const totalClosingWorkCount = closingWorkTasks.length;
  const totalOpeningWorkCount = openingWorkTasks.length;
  const doneClosingTodayCount = totalClosingWorkCount - visibleClosingWorkTasks.length;
  const doneOpeningTodayCount = totalOpeningWorkCount - visibleOpeningWorkTasks.length;

  useEffect(() => {
    let mounted = true;

    const loadOperationsData = async () => {
      const [{ data: templates, error: templatesError }, { data: completions, error: completionsError }] =
        await Promise.all([
          supabase
            .from("checklist_templates")
            .select("id,shift,task_label,icon_name,color_class,bg_class,sort_order,is_active")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("checklist_completions")
            .select("id,shift,task_label,completed_at")
            .order("completed_at", { ascending: false }),
        ]);

      if (!mounted || templatesError || completionsError || !templates || !completions) {
        return;
      }

      const rows = templates as ChecklistTemplateRow[];
      const openingRows = rows.filter((row) => row.shift === "opening");
      const closingRows = rows.filter((row) => row.shift === "closing");

      const toWorkTask = (row: ChecklistTemplateRow, fallbackShift: "opening" | "closing"): WorkTask => ({
        id: row.id,
        icon: mapIconNameToWorkTaskIcon(row.icon_name),
        label: row.task_label,
        color: row.color_class ?? (fallbackShift === "opening" ? "text-pink-600" : "text-purple-600"),
        bg: row.bg_class ?? (fallbackShift === "opening" ? "bg-pink-100" : "bg-purple-100"),
      });

      setOpeningWorkTasks(openingRows.map((row) => toWorkTask(row, "opening")));
      setClosingWorkTasks(closingRows.map((row) => toWorkTask(row, "closing")));

      const completionRows = completions as ChecklistCompletionRow[];
      const toDoneTask = (row: ChecklistCompletionRow): DoneTask => ({
        id: row.id,
        label: row.task_label,
        date: formatDateForDoneTask(row.completed_at),
        time: new Date(row.completed_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      });
      setOpeningDoneTasks(
        completionRows.filter((row) => row.shift === "opening").map((row) => toDoneTask(row))
      );
      setClosingDoneTasks(
        completionRows.filter((row) => row.shift === "closing").map((row) => toDoneTask(row))
      );
    };

    loadOperationsData().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddWorkTask = () => {
    const trimmedLabel = workLabel.trim();
    if (!trimmedLabel) {
      return;
    }
    const newTask: WorkTask = {
      id: `w-${Date.now()}`,
      icon: workShift === "closing" ? "sparkles" : "thermometer",
      label: trimmedLabel,
      color: workShift === "closing" ? "text-purple-600" : "text-pink-600",
      bg: workShift === "closing" ? "bg-purple-100" : "bg-pink-100",
    };
    if (workShift === "closing") {
      setClosingWorkTasks((prev) => [...prev, newTask]);
    } else {
      setOpeningWorkTasks((prev) => [...prev, newTask]);
    }
    setWorkLabel("");
    setIsAddWorkOpen(false);
  };

  const handleAddDoneTask = () => {
    const trimmedLabel = doneLabel.trim();
    if (!trimmedLabel || !doneDate || !doneTime) {
      return;
    }
    const newTask: DoneTask = {
      id: `done-${Date.now()}`,
      label: trimmedLabel,
      date: formatDateForDoneTask(doneDate),
      time: doneTime,
    };
    if (doneShift === "closing") {
      setClosingDoneTasks((prev) => [newTask, ...prev]);
    } else {
      setOpeningDoneTasks((prev) => [newTask, ...prev]);
    }
    setDoneLabel("");
    setDoneDate("");
    setDoneTime("");
    setIsAddDoneOpen(false);
  };

  const handleDeleteDoneTask = async (taskId: string, shift: "opening" | "closing") => {
    await supabase.from("checklist_completions").delete().eq("id", taskId);
    if (shift === "closing") {
      setClosingDoneTasks((prev) => prev.filter((task) => task.id !== taskId));
      return;
    }
    setOpeningDoneTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleCompleteWorkTask = (task: WorkTask, shift: "opening" | "closing") => {
    const nowDateTime = getNowDoneDateTime();
    const completionIso = new Date().toISOString();
    const optimisticId = `done-${Date.now()}-${task.id}`;
    const doneTask: DoneTask = {
      id: optimisticId,
      label: task.label,
      date: nowDateTime.date,
      time: nowDateTime.time,
    };
    if (shift === "closing") {
      setClosingDoneTasks((prev) => [doneTask, ...prev]);
    } else {
      setOpeningDoneTasks((prev) => [doneTask, ...prev]);
    }

    void (async () => {
      const { data, error } = await supabase
        .from("checklist_completions")
        .insert({
          shift,
          task_label: task.label,
          completed_at: completionIso,
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        if (shift === "closing") {
          setClosingDoneTasks((prev) => prev.filter((item) => item.id !== optimisticId));
        } else {
          setOpeningDoneTasks((prev) => prev.filter((item) => item.id !== optimisticId));
        }
        return;
      }

      if (shift === "closing") {
        setClosingDoneTasks((prev) =>
          prev.map((item) => (item.id === optimisticId ? { ...item, id: data.id } : item))
        );
      } else {
        setOpeningDoneTasks((prev) =>
          prev.map((item) => (item.id === optimisticId ? { ...item, id: data.id } : item))
        );
      }
    })();
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white scrollbar-hide">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-on-background mb-2">Checklist Management</h1>
            <p className="text-gray-500 font-medium">Manage daily operational task lists for kitchen staff.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Checklist work */}
          <div className="xl:col-span-8 space-y-6 rounded-2xl border border-secondary-main/20 bg-secondary-main/5 p-5">
            <div className="flex items-center justify-between border-b border-secondary-main/20 pb-4">
              <h2 className="text-2xl font-display font-bold text-secondary-main">Checklist work</h2>
              <button
                type="button"
                onClick={() => setIsAddWorkOpen(true)}
                className="flex items-center gap-1.5 text-secondary-main font-bold text-sm bg-secondary-main/10 px-4 py-2 rounded-full hover:bg-secondary-main/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
              {/* Closing Team Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-[0.2em]">Closing team</h3>
                  <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-extrabold text-white">
                    {visibleClosingWorkTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {visibleClosingWorkTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ x: 4 }}
                      onClick={() => handleCompleteWorkTask(task, "closing")}
                      className="group bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-secondary-main/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${task.bg} ${task.color}`}>
                          {renderWorkTaskIcon(task.icon)}
                        </div>
                        <span className="font-medium text-gray-700">{task.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-secondary-main transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Opening Team Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-[0.2em]">Opening team</h3>
                  <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-extrabold text-white">
                    {visibleOpeningWorkTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {visibleOpeningWorkTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ x: 4 }}
                      onClick={() => handleCompleteWorkTask(task, "opening")}
                      className="group bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-secondary-main/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${task.bg} ${task.color}`}>
                          {renderWorkTaskIcon(task.icon)}
                        </div>
                        <span className="font-medium text-gray-700">{task.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-secondary-main transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Checklist DONE */}
          <div className="xl:col-span-4 space-y-6 rounded-2xl border border-primary-main/20 bg-primary-main/5 p-5">
            <div className="flex items-center justify-between border-b border-primary-main/20 pb-4">
              <h2 className="text-2xl font-display font-bold text-primary-main">Checklist DONE</h2>
            </div>

            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <div className="col-span-6">Task ID List</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2 text-right">Time</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-8">
              {/* Closing Team Done */}
              <div className="space-y-3">
                <div className="px-4 flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-[0.2em]">Closing team</h3>
                  <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-extrabold text-white">
                    {doneClosingTodayCount}/{totalClosingWorkCount}
                  </span>
                </div>
                <div className="space-y-2">
                  {closingDoneTasks.map((task) => (
                    <motion.div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-xl group border border-transparent hover:border-gray-200 transition-all">
                      <div className="col-span-1 md:col-span-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary-main fill-primary-main/10" />
                        <span className="font-medium text-gray-400 line-through truncate">{task.label}</span>
                      </div>
                      <div className="col-span-1 md:col-span-3 text-sm font-semibold text-gray-500">{task.date}</div>
                      <div className="col-span-1 md:col-span-2 text-right text-sm font-bold text-gray-500">{task.time}</div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDoneTask(task.id, "closing")}
                          className="text-tertiary-main opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-tertiary-main/10 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Opening Team Done */}
              <div className="space-y-3">
                <div className="px-4 flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-[0.2em]">Opening team</h3>
                  <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-extrabold text-white">
                    {doneOpeningTodayCount}/{totalOpeningWorkCount}
                  </span>
                </div>
                <div className="space-y-2">
                  {openingDoneTasks.map((task) => (
                    <motion.div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-xl group border border-transparent hover:border-gray-200 transition-all">
                      <div className="col-span-1 md:col-span-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary-main fill-primary-main/10" />
                        <span className="font-medium text-gray-400 line-through truncate">{task.label}</span>
                      </div>
                      <div className="col-span-1 md:col-span-3 text-sm font-semibold text-gray-500">{task.date}</div>
                      <div className="col-span-1 md:col-span-2 text-right text-sm font-bold text-gray-500">{task.time}</div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDoneTask(task.id, "opening")}
                          className="text-tertiary-main opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-tertiary-main/10 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddWorkOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add checklist work task</h3>
              <button
                type="button"
                onClick={() => setIsAddWorkOpen(false)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Team</span>
                <select
                  value={workShift}
                  onChange={(event) => setWorkShift(event.target.value as "closing" | "opening")}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                >
                  <option value="closing">Closing team</option>
                  <option value="opening">Opening team</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Task name</span>
                <input
                  type="text"
                  value={workLabel}
                  onChange={(event) => setWorkLabel(event.target.value)}
                  placeholder="Enter task name..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddWorkOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWorkTask}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-primary-main hover:bg-primary-main/90"
              >
                Add task
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddDoneOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add checklist done entry</h3>
              <button
                type="button"
                onClick={() => setIsAddDoneOpen(false)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Team</span>
                <select
                  value={doneShift}
                  onChange={(event) => setDoneShift(event.target.value as "closing" | "opening")}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                >
                  <option value="closing">Closing team</option>
                  <option value="opening">Opening team</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Task name</span>
                <input
                  type="text"
                  value={doneLabel}
                  onChange={(event) => setDoneLabel(event.target.value)}
                  placeholder="Enter completed task..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">Date</span>
                  <input
                    type="date"
                    value={doneDate}
                    onChange={(event) => setDoneDate(event.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">Time</span>
                  <input
                    type="time"
                    value={doneTime}
                    onChange={(event) => setDoneTime(event.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                  />
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddDoneOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddDoneTask}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-primary-main hover:bg-primary-main/90"
              >
                Add entry
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const TableSettings = () => {
  const [imageNameLink, setImageNameLink] = useState(BRAND_LOGO_URL);
  const [videoLink, setVideoLink] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white scrollbar-hide">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-background mb-2">Settings</h1>
          <p className="text-gray-500 font-medium">
            Cai dat ten anh (dang link) va link video cho bang.
          </p>
        </div>

        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Bang Setting</h2>

          <div className="space-y-4">
            <label className="space-y-2 block">
              <span className="text-sm font-bold text-gray-700">Ten anh (link anh)</span>
              <input
                type="url"
                placeholder="https://example.com/logo.jpg"
                value={imageNameLink}
                onChange={(e) => setImageNameLink(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-bold text-gray-700">Link video</span>
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="rounded-xl border border-gray-100 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Preview image</p>
              {imageNameLink ? (
                <img
                  src={imageNameLink}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg bg-gray-50"
                />
              ) : (
                <div className="w-full h-40 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                  Chua co link anh
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Preview video</p>
              {videoLink ? (
                isIframeVideoSource(videoLink) ? (
                  <iframe
                    src={getEmbeddableVideoUrl(videoLink)}
                    title="Google Drive video preview"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="w-full h-40 rounded-lg bg-gray-50"
                  />
                ) : (
                  <video
                    src={videoLink}
                    controls
                    className="w-full h-40 rounded-lg bg-gray-50"
                  />
                )
              ) : (
                <div className="w-full h-40 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                  Chua co link video
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setSavedAt(new Date().toLocaleTimeString())}
              className="bg-primary-main text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-main/90 transition-all"
            >
              Save settings
            </button>
            {savedAt && <span className="text-sm text-gray-500">Saved at {savedAt}</span>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => getTabFromPath(window.location.pathname));
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "failed">("checking");
  const [dashboardData, setDashboardData] = useState<Category[]>(DASHBOARD_DATA);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [selectedDashboardItems, setSelectedDashboardItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    image: "",
    videoUrl: "",
  });
  const [videoPreview, setVideoPreview] = useState<{ name: string; url: string } | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrapSupabaseData = async () => {
      const { error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setSupabaseStatus("failed");
        return;
      }

      setSupabaseStatus("connected");

      const [{ data: categories, error: categoriesError }, { data: tasks, error: tasksError }] =
        await Promise.all([
          supabase
            .from("dashboard_categories")
            .select("id,slug,title,icon_name,color,sort_order,sub_header")
            .order("sort_order", { ascending: true }),
          supabase
            .from("dashboard_tasks")
            .select(
              "id,category_id,task_name,image_url,urgent_text,info_text,video_url,is_special,sort_order"
            )
            .order("sort_order", { ascending: true }),
        ]);

      if (!mounted || categoriesError || tasksError || !categories || !tasks) {
        return;
      }

      setDashboardData(
        mapDashboardRowsToCategories(
          categories as DashboardCategoryRow[],
          tasks as DashboardTaskRow[]
        )
      );
    };

    bootstrapSupabaseData().catch(() => {
      if (mounted) {
        setSupabaseStatus("failed");
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateToTab = (tab: AppTab) => {
    setActiveTab(tab);
    const nextPath = TAB_TO_PATH[tab];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  const handleEditDashboardItem = (item: MenuItem) => {
    setEditingItem(item);
    setImageUploadError(null);
    setSaveError(null);
    setEditForm({
      name: item.name,
      image: item.image,
      videoUrl: item.videoUrl ?? "",
    });
  };

  const handleToggleDashboardItemSelected = (itemId: string) => {
    setSelectedDashboardItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleOpenTaskVideo = (item: MenuItem) => {
    if (!item.videoUrl) {
      return;
    }
    setVideoPreview({ name: item.name, url: item.videoUrl });
  };

  const handleSaveItemEdit = async () => {
    if (!editingItem) {
      return;
    }
    const nextName = editForm.name.trim();
    const nextImage = editForm.image.trim();
    if (!nextName || !nextImage) {
      return;
    }
    setSaveError(null);
    const nextVideoUrl = editForm.videoUrl.trim() || undefined;

    setDashboardData((prev) =>
      prev.map((category) => ({
        ...category,
        items: category.items.map((task) =>
          task.id === editingItem.id
            ? {
                ...task,
                name: nextName,
                image: nextImage,
                videoUrl: nextVideoUrl,
              }
            : task
        ),
        specialItems: category.specialItems?.map((task) =>
          task.id === editingItem.id
            ? {
                ...task,
                name: nextName,
                image: nextImage,
                videoUrl: nextVideoUrl,
              }
            : task
        ),
      }))
    );

    if (supabaseStatus === "connected") {
      const { error } = await supabase
        .from("dashboard_tasks")
        .update({
          task_name: nextName,
          image_url: nextImage,
          video_url: nextVideoUrl ?? null,
        })
        .eq("id", editingItem.id);

      if (error) {
        setSaveError("Cannot save to database. Please run latest migration and try again.");
        return;
      }
    }

    setImageUploadError(null);
    setEditingItem(null);
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setImageUploadError("Please select a valid image file.");
      return;
    }

    try {
      const base64Image = await convertFileToBase64(selectedFile);
      setEditForm((prev) => ({ ...prev, image: base64Image }));
      setImageUploadError(null);
    } catch {
      setImageUploadError("Cannot upload image. Please try another file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm antialiased">
        <div className="flex items-center gap-10">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src={BRAND_LOGO_URL}
              alt="Aseer Time logo"
              className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-primary-main/20 border border-primary-main/20"
            />
            <span className="text-xl font-display font-black tracking-tight text-gray-900">Aseer Time</span>
          </motion.div>
          
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { id: "checkwwork", label: "Checkwork", icon: <ClipboardList className="w-4 h-4" /> },
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: "operations", label: "Operations", icon: <Settings2 className="w-4 h-4" /> },
              { id: "settings", label: "Settings", icon: <Settings2 className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  (item.id === "checkwwork" ||
                    item.id === "dashboard" ||
                    item.id === "operations" ||
                    item.id === "settings") &&
                  navigateToTab(item.id as AppTab)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? "bg-primary-main text-white shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center text-xs font-bold">
            <span
              className={`px-3 py-1 rounded-full ${
                supabaseStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : supabaseStatus === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              Supabase:{" "}
              {supabaseStatus === "connected"
                ? "Connected"
                : supabaseStatus === "failed"
                  ? "Failed"
                  : "Checking..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {activeTab === "checkwwork" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditingDashboard((prev) => !prev)}
              className={`flex px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm items-center gap-2 transition-all shadow-md ${
                isEditingDashboard
                  ? "bg-green-600 text-white shadow-green-600/20"
                  : "bg-white text-primary-main border border-primary-main/30"
              }`}
            >
              <Pencil className="w-5 h-5" /> {isEditingDashboard ? "Done Edit" : "Edit"}
            </motion.button>
          )}
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex bg-primary-main text-white px-5 py-2.5 rounded-xl font-bold text-sm items-center gap-2 hover:bg-primary-main/90 transition-all shadow-md shadow-primary-main/10"
          >
            <Plus className="w-5 h-5" /> Add Task
          </motion.button>
          
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary-main rounded-full border-2 border-white"></span>
            </button>
            <button className="p-1 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
              <UserCircle className="w-8 h-8" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <img
          src={BRAND_LOGO_URL}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute right-6 bottom-6 w-52 h-52 object-cover rounded-full opacity-10 z-0"
        />
        <AnimatePresence mode="wait">
          {activeTab === "checkwwork" ? (
            <motion.main 
              key="checkwwork"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10"
            >
              {dashboardData.map((category) => (
                <CategoryColumn
                  key={category.id}
                  category={category}
                  isEditing={isEditingDashboard}
                  selectedItemIds={selectedDashboardItems}
                  onToggleTaskSelected={handleToggleDashboardItemSelected}
                  onEditTask={handleEditDashboardItem}
                  onOpenTaskVideo={handleOpenTaskVideo}
                />
              ))}
            </motion.main>
          ) : activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full relative z-10"
            >
              <DailyReportDashboard />
            </motion.div>
          ) : activeTab === "operations" ? (
            <motion.div
              key="operations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full relative z-10"
            >
              <OperationsDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full relative z-10"
            >
              <TableSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-gray-900/90 backdrop-blur-lg border border-white/10 flex justify-around py-3 px-6 rounded-2xl shadow-2xl z-50">
        {[
          { id: "checkwwork", label: "Checkwork", icon: <ClipboardList /> },
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
          { id: "operations", label: "Tasks", icon: <ClipboardList /> },
          { id: "settings", label: "Settings", icon: <Settings2 /> },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() =>
              (item.id === "checkwwork" ||
                item.id === "dashboard" ||
                item.id === "operations" ||
                item.id === "settings") &&
              navigateToTab(item.id as AppTab)
            }
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id
                ? "text-white bg-primary-main px-3 py-1.5 rounded-xl"
                : "text-gray-500"
            }`}
          >
            {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6" })}
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {activeTab === "checkwwork" && (
        <button
          type="button"
          onClick={() => setIsEditingDashboard((prev) => !prev)}
          className={`fixed right-4 bottom-24 z-[55] lg:hidden flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-xl transition-all ${
            isEditingDashboard
              ? "bg-green-600 text-white"
              : "bg-primary-main text-white"
          }`}
        >
          <Pencil className="w-4 h-4" />
          {isEditingDashboard ? "Done Edit" : "Edit"}
        </button>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit card information</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Name</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Image (URL or Base64)</span>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, image: e.target.value }));
                    if (imageUploadError) {
                      setImageUploadError(null);
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Upload image as Base64</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-main/10 file:px-3 file:py-1.5 file:text-primary-main file:font-bold hover:file:bg-primary-main/20"
                />
                {imageUploadError && <p className="text-sm text-red-600">{imageUploadError}</p>}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Video URL</span>
                <input
                  type="url"
                  value={editForm.videoUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}

              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Image preview</p>
                <img
                  src={editForm.image}
                  alt={editForm.name || "Preview"}
                  className="w-full h-44 object-cover rounded-lg bg-gray-50"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItemEdit}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-primary-main hover:bg-primary-main/90"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {videoPreview && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 text-white">
            <h3 className="text-lg font-bold truncate">{videoPreview.name}</h3>
            <button
              type="button"
              onClick={() => setVideoPreview(null)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-bold"
            >
              Close
            </button>
          </div>
          <div className="flex-1 p-4 md:p-8">
            {isIframeVideoSource(videoPreview.url) ? (
              <iframe
                src={getEmbeddableVideoUrl(videoPreview.url)}
                title={videoPreview.name}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-xl bg-black"
              />
            ) : (
              <video
                src={videoPreview.url}
                controls
                autoPlay
                className="w-full h-full rounded-xl bg-black object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
