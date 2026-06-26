/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
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
  ClipboardList,
  CalendarRange,
  Search,
  Star
} from "lucide-react";
import { supabase } from "./lib/supabase";

const BRAND_LOGO_URL =
  "https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fa149df68.%E1%BA%A2nh.173719.jpg";

type AppTab = "checkwwork" | "dashboard" | "operations" | "evaluation" | "settings";

const TAB_TO_PATH: Record<AppTab, string> = {
  checkwwork: "/checkwwork",
  dashboard: "/dashboard",
  operations: "/operations",
  evaluation: "/evaluation",
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
  if (pathname.startsWith("/evaluation")) {
    return "evaluation";
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
  /** Supabase dashboard_categories.id (UUID); omit for static fallback data */
  dbCategoryId?: string;
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
        dbCategoryId: categoryRow.id,
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
    <section className="flex flex-col h-full bg-white/88 backdrop-blur-[2px] border-r border-gray-100 last:border-r-0">
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

const formatDateKeyToWeekday = (dateKey: string) => {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

/** Inclusive list of YYYY-MM-DD keys from fromKey to toKey (valid ISO dates). */
const enumerateDateKeysInRange = (fromKey: string, toKey: string): string[] => {
  if (!fromKey || !toKey || fromKey > toKey) {
    return [];
  }
  const keys: string[] = [];
  const cur = new Date(`${fromKey}T12:00:00`);
  const end = new Date(`${toKey}T12:00:00`);
  while (cur <= end) {
    keys.push(toDateKeyLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
};

const DailyReportDashboard = () => {
  const [templateRows, setTemplateRows] = useState<ChecklistTemplateRow[]>([]);
  const [completionRows, setCompletionRows] = useState<ChecklistCompletionRow[]>([]);
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return toDateKeyLocal(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [toDate, setToDate] = useState(() => toDateKeyLocal(new Date()));
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

  const completionsByDate = useMemo(() => {
    const map = new Map<string, ChecklistCompletionRow[]>();
    for (const row of completionRows) {
      const dateKey = toDateKeyLocal(new Date(row.completed_at));
      const list = map.get(dateKey) ?? [];
      list.push(row);
      map.set(dateKey, list);
    }
    return map;
  }, [completionRows]);

  const dateCards = useMemo(() => {
    const keysInRange = enumerateDateKeysInRange(fromDate, toDate).sort((a, b) => b.localeCompare(a));
    const totalOpening = templateRows.filter((row) => row.shift === "opening").length;
    const totalClosing = templateRows.filter((row) => row.shift === "closing").length;

    return keysInRange.map((dateKey) => {
      const rows = completionsByDate.get(dateKey) ?? [];
      const doneLabelsByShift = {
        opening: new Set(rows.filter((row) => row.shift === "opening").map((row) => row.task_label)),
        closing: new Set(rows.filter((row) => row.shift === "closing").map((row) => row.task_label)),
      };
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
        weekday: formatDateKeyToWeekday(dateKey),
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
  }, [fromDate, toDate, completionsByDate, templateRows]);

  useEffect(() => {
    if (dateCards.length === 0) {
      setSelectedDateKey(null);
      return;
    }
    if (!selectedDateKey || !dateCards.some((card) => card.dateKey === selectedDateKey)) {
      setSelectedDateKey(dateCards[0].dateKey);
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

  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const rangeIncomplete = !fromDate || !toDate;
  const setPresetLastDays = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setFromDate(toDateKeyLocal(start));
    setToDate(toDateKeyLocal(end));
  };
  const setPresetThisMonth = () => {
    const now = new Date();
    setFromDate(toDateKeyLocal(new Date(now.getFullYear(), now.getMonth(), 1)));
    setToDate(toDateKeyLocal(now));
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent scrollbar-hide">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Reports</p>
              <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="mt-1 text-slate-600 text-sm max-w-lg">
                Completion by day for the selected range. Each card is one calendar day; percentages compare
                checklist completions to active templates.
              </p>
            </div>
            <div className="w-full lg:w-auto space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 mr-1">Quick range</span>
                <button
                  type="button"
                  onClick={() => setPresetLastDays(7)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => setPresetThisMonth()}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  This month
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700 min-w-[140px]">
                  From
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700 min-w-[140px]">
                  To
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                  />
                </label>
                <div className="hidden sm:flex items-center justify-center pb-2 text-slate-300">
                  <CalendarRange className="w-5 h-5" aria-hidden />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Daily cards</h2>
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {rangeIncomplete
                ? "Set both dates"
                : rangeInvalid
                  ? "Invalid range"
                  : `${dateCards.length} day${dateCards.length === 1 ? "" : "s"} in range`}
            </span>
          </div>
          {rangeIncomplete ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-600 text-sm">
              Select both <strong className="text-slate-800">From</strong> and <strong className="text-slate-800">To</strong>{" "}
              to show one card per day in that range.
            </div>
          ) : rangeInvalid ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
              &quot;From&quot; must be on or before &quot;To&quot;. Adjust the dates to see cards.
            </div>
          ) : dateCards.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500 text-sm">
              No days in this range.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {dateCards.map((card) => {
                const isActive = selectedDateKey === card.dateKey;
                return (
                  <button
                    key={card.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(card.dateKey)}
                    className={`group text-left rounded-2xl border p-5 transition-all duration-200 ${
                      isActive
                        ? "border-primary-main bg-white ring-2 ring-primary-main/30 shadow-md shadow-slate-200/60"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.weekday}</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">{card.label}</p>
                      </div>
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-extrabold tabular-nums ${
                          card.completionPercent >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : card.completionPercent >= 40
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {card.completionPercent}% total
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">{card.totalDone}</span>
                      <span className="text-slate-400"> / </span>
                      {card.totalTasks} tasks completed
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50/90 border border-emerald-100 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/90">Opening</p>
                          <p className="text-base font-extrabold text-emerald-900 tabular-nums">{card.openingPercent}%</p>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-emerald-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${card.openingPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-xl bg-orange-50/90 border border-orange-100 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-900/90">Closing</p>
                          <p className="text-base font-extrabold text-orange-950 tabular-nums">{card.closingPercent}%</p>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-orange-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-600 transition-all duration-300"
                            style={{ width: `${card.closingPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-200/40 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Day detail</h2>
            {selectedCard ? (
              <p className="text-sm text-slate-500 mt-1">
                {selectedCard.weekday} · {selectedCard.label}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-1">Select a day card above.</p>
            )}
          </div>
          {selectedCard ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Opening team</p>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-950 tabular-nums">
                    {selectedCard.doneOpening}
                    <span className="text-lg font-bold text-emerald-700/80"> / {selectedCard.totalOpening}</span>
                  </p>
                  <p className="mt-1 text-sm font-medium text-emerald-800/90">
                    {selectedCard.totalOpening - selectedCard.doneOpening} pending
                  </p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-900">Closing team</p>
                  <p className="mt-2 text-2xl font-extrabold text-orange-950 tabular-nums">
                    {selectedCard.doneClosing}
                    <span className="text-lg font-bold text-orange-800/80"> / {selectedCard.totalClosing}</span>
                  </p>
                  <p className="mt-1 text-sm font-medium text-orange-900/90">
                    {selectedCard.totalClosing - selectedCard.doneClosing} pending
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                  <p className="text-sm font-bold text-slate-800 mb-3">Opening — pending</p>
                  <ul className="space-y-2 text-sm text-slate-600 max-h-64 overflow-y-auto pr-1">
                    {openingPending.length > 0 ? (
                      openingPending.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2 text-slate-700"
                        >
                          <span className="text-slate-400 shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic py-2">All opening tasks completed.</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                  <p className="text-sm font-bold text-slate-800 mb-3">Closing — pending</p>
                  <ul className="space-y-2 text-sm text-slate-600 max-h-64 overflow-y-auto pr-1">
                    {closingPending.length > 0 ? (
                      closingPending.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2 text-slate-700"
                        >
                          <span className="text-slate-400 shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic py-2">All closing tasks completed.</li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            !rangeInvalid && (
              <p className="text-sm text-slate-500">Select a day card to view pending tasks and counts.</p>
            )
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
  const [operationsSearch, setOperationsSearch] = useState("");
  const todayDoneDateLabel = getTodayDoneDateLabel();

  const operationsSearchNorm = operationsSearch.trim().toLowerCase();
  const taskLabelMatchesSearch = (label: string) =>
    !operationsSearchNorm || label.toLowerCase().includes(operationsSearchNorm);
  const doneTaskMatchesSearch = (task: DoneTask) => {
    if (!operationsSearchNorm) {
      return true;
    }
    return (
      task.label.toLowerCase().includes(operationsSearchNorm) ||
      task.date.toLowerCase().includes(operationsSearchNorm) ||
      task.time.toLowerCase().includes(operationsSearchNorm)
    );
  };

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

  const filteredClosingWorkTasks = visibleClosingWorkTasks.filter((task) =>
    taskLabelMatchesSearch(task.label)
  );
  const filteredOpeningWorkTasks = visibleOpeningWorkTasks.filter((task) =>
    taskLabelMatchesSearch(task.label)
  );
  const filteredClosingDoneTasks = closingDoneTasks.filter(doneTaskMatchesSearch);
  const filteredOpeningDoneTasks = openingDoneTasks.filter(doneTaskMatchesSearch);

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
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent scrollbar-hide">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-on-background mb-2">Checklist Management</h1>
            <p className="text-gray-500 font-medium">Manage daily operational task lists for kitchen staff.</p>
          </div>
        </div>

        <div className="mb-8 max-w-2xl">
          <label className="relative block">
            <span className="sr-only">Search tasks</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={operationsSearch}
              onChange={(e) => setOperationsSearch(e.target.value)}
              placeholder="Search by task name, date, or time…"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-secondary-main/40 focus:outline-none focus:ring-2 focus:ring-secondary-main/20"
            />
          </label>
          {operationsSearchNorm ? (
            <p className="mt-2 text-xs font-semibold text-gray-500">
              Showing matches in Checklist work and Checklist DONE
            </p>
          ) : null}
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
                    {filteredClosingWorkTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredClosingWorkTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 px-1">
                      {visibleClosingWorkTasks.length === 0
                        ? "No remaining closing tasks today."
                        : "No closing tasks match your search."}
                    </p>
                  ) : null}
                  {filteredClosingWorkTasks.map((task) => (
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
                    {filteredOpeningWorkTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredOpeningWorkTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 px-1">
                      {visibleOpeningWorkTasks.length === 0
                        ? "No remaining opening tasks today."
                        : "No opening tasks match your search."}
                    </p>
                  ) : null}
                  {filteredOpeningWorkTasks.map((task) => (
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
                  {filteredClosingDoneTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3 px-4">
                      {closingDoneTasks.length === 0
                        ? "No closing completions yet."
                        : "No closing completions match your search."}
                    </p>
                  ) : null}
                  {filteredClosingDoneTasks.map((task) => (
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
                  {filteredOpeningDoneTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3 px-4">
                      {openingDoneTasks.length === 0
                        ? "No opening completions yet."
                        : "No opening completions match your search."}
                    </p>
                  ) : null}
                  {filteredOpeningDoneTasks.map((task) => (
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

interface BranchSettingRow {
  id: string;
  branch_name: string;
  logo_url: string;
  video_url: string;
  notes: string | null;
  sort_order: number;
}

interface EvaluationCriterionRow {
  id: string;
  label: string;
  description: string | null;
  max_score: number;
  sort_order: number;
  is_active: boolean;
}

interface StaffMemberRow {
  id: string;
  full_name: string;
  branch_name: string;
  role: string | null;
  phone: string | null;
  sort_order: number;
  is_active: boolean;
}

type SettingsSection = "branches" | "criteria" | "staff";

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const PercentSlider = ({
  value,
  onChange,
  accent = "primary",
}: {
  value: number;
  onChange: (value: number) => void;
  accent?: "primary" | "manager";
}) => {
  const barClass =
    accent === "manager"
      ? "accent-violet-600 [&::-webkit-slider-runnable-track]:bg-violet-100"
      : "accent-primary-main [&::-webkit-slider-runnable-track]:bg-slate-100";

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`flex-1 h-2 rounded-full cursor-pointer ${barClass}`}
      />
      <span
        className={`w-12 text-right text-sm font-bold tabular-nums shrink-0 ${
          accent === "manager" ? "text-violet-700" : "text-primary-main"
        }`}
      >
        {value}%
      </span>
    </div>
  );
};

const StaffEvaluationPanel = () => {
  const [staffList, setStaffList] = useState<StaffMemberRow[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriterionRow[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(todayIsoDate);
  const [percents, setPercents] = useState<Record<string, number>>({});
  const [managerPercent, setManagerPercent] = useState(0);
  const [evaluatorName, setEvaluatorName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoadError(null);
    const [{ data: staffData, error: staffError }, { data: criteriaData, error: criteriaError }] =
      await Promise.all([
        supabase
          .from("staff_members")
          .select("id,full_name,branch_name,role,phone,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("evaluation_criteria")
          .select("id,label,description,max_score,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

    if (staffError || criteriaError) {
      setLoadError(
        "Could not load data. Run migration 20260503_staff_evaluation.sql in Supabase."
      );
      return;
    }

    const staffRows = (staffData ?? []) as StaffMemberRow[];
    const criteriaRows = (criteriaData ?? []) as EvaluationCriterionRow[];
    setStaffList(staffRows);
    setCriteria(criteriaRows);
    if (!selectedStaffId && staffRows.length > 0) {
      setSelectedStaffId(staffRows[0].id);
    }
  };

  const loadScoresForStaff = async (
    staffId: string,
    date: string,
    criteriaRows: EvaluationCriterionRow[]
  ) => {
    if (!staffId) {
      setPercents({});
      setManagerPercent(0);
      setManagerName("");
      return;
    }
    const [{ data: evalData, error: evalError }, { data: managerData, error: managerError }] =
      await Promise.all([
        supabase
          .from("staff_evaluations")
          .select("criterion_id,score,evaluator_name")
          .eq("staff_id", staffId)
          .eq("evaluation_date", date),
        supabase
          .from("staff_evaluation_manager")
          .select("manager_percent,manager_name")
          .eq("staff_id", staffId)
          .eq("evaluation_date", date)
          .maybeSingle(),
      ]);

    if (evalError) {
      setPercents({});
      return;
    }

    const next: Record<string, number> = {};
    let loadedEvaluator = "";
    for (const row of evalData ?? []) {
      next[row.criterion_id as string] = row.score as number;
      if (row.evaluator_name) {
        loadedEvaluator = row.evaluator_name as string;
      }
    }
    for (const c of criteriaRows) {
      if (next[c.id] == null) {
        next[c.id] = 0;
      }
    }
    setPercents(next);
    if (loadedEvaluator) {
      setEvaluatorName(loadedEvaluator);
    }

    if (!managerError && managerData) {
      setManagerPercent(managerData.manager_percent as number);
      setManagerName((managerData.manager_name as string) ?? "");
    } else {
      setManagerPercent(0);
      setManagerName("");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (selectedStaffId && criteria.length > 0) {
      void loadScoresForStaff(selectedStaffId, evaluationDate, criteria);
    }
  }, [selectedStaffId, evaluationDate, criteria]);

  const setCriterionPercent = (criterionId: string, percent: number) => {
    setPercents((prev) => ({ ...prev, [criterionId]: percent }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!selectedStaffId) {
      setSaveMessage({ text: "Please select a staff member.", ok: false });
      return;
    }
    const missing = criteria.filter((c) => percents[c.id] == null);
    if (missing.length > 0) {
      setSaveMessage({ text: "Please set the percentage slider for every criterion.", ok: false });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const rows = criteria.map((c) => ({
      staff_id: selectedStaffId,
      criterion_id: c.id,
      score: percents[c.id],
      evaluation_date: evaluationDate,
      evaluator_name: evaluatorName.trim() || null,
      updated_at: new Date().toISOString(),
    }));

    const [{ error: evalError }, { error: managerError }] = await Promise.all([
      supabase.from("staff_evaluations").upsert(rows, {
        onConflict: "staff_id,criterion_id,evaluation_date",
      }),
      supabase.from("staff_evaluation_manager").upsert(
        {
          staff_id: selectedStaffId,
          evaluation_date: evaluationDate,
          manager_percent: managerPercent,
          manager_name: managerName.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "staff_id,evaluation_date" }
      ),
    ]);

    setIsSaving(false);
    if (evalError || managerError) {
      setSaveMessage({
        text: managerError?.message?.includes("staff_evaluation_manager")
          ? "Save failed. Run migration 20260504_evaluation_percent.sql."
          : "Save failed. Check Supabase policies.",
        ok: false,
      });
      return;
    }
    setSaveMessage({ text: "Evaluation saved.", ok: true });
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
  const ratedCount = criteria.filter((c) => percents[c.id] != null).length;
  const averagePercent =
    ratedCount > 0
      ? Math.round(
          criteria.reduce((sum, c) => sum + (percents[c.id] ?? 0), 0) / ratedCount
        )
      : null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
            Staff evaluation
          </p>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">
            Score by day
          </h2>
          <p className="text-slate-600 text-sm">
            Pick a date and staff member, then drag the percentage slider for each criterion. Manager sign-off is a separate column.
          </p>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {loadError}
          </div>
        )}

        {staffList.length === 0 && !loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            No staff yet. Go to <strong>Settings → Staff</strong> to add employees.
          </div>
        ) : null}

        {criteria.length === 0 && !loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            No evaluation criteria yet. Go to <strong>Settings → Evaluation criteria</strong> to add some.
          </div>
        ) : null}

        {staffList.length > 0 && criteria.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">Evaluation date</span>
                <input
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">Staff</span>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                      {s.branch_name ? ` · ${s.branch_name}` : ""}
                      {s.role ? ` · ${s.role}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">Evaluator</span>
                <input
                  type="text"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  placeholder="Shift lead / evaluator"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
              <span className="text-slate-600">
                Criteria avg:{" "}
                <strong className="text-primary-main text-lg">
                  {averagePercent != null ? `${averagePercent}%` : "—"}
                </strong>
                <span className="text-slate-400 ml-1">
                  ({ratedCount}/{criteria.length})
                </span>
              </span>
              <span className="text-slate-600">
                Manager sign-off:{" "}
                <strong className="text-violet-700 text-lg">{managerPercent}%</strong>
              </span>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90">
                      <th className="px-4 py-3 font-bold text-slate-700 min-w-[160px]">Criterion</th>
                      <th className="px-4 py-3 font-bold text-slate-700 min-w-[220px]">Percent</th>
                      <th className="px-4 py-3 font-bold text-violet-800 min-w-[220px]">
                        Manager sign-off
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criteria.map((criterion) => (
                      <tr key={criterion.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 align-middle">
                          <p className="font-bold text-slate-900">{criterion.label}</p>
                          {criterion.description ? (
                            <p className="text-xs text-slate-500 mt-0.5">{criterion.description}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <PercentSlider
                            value={percents[criterion.id] ?? 0}
                            onChange={(v) => setCriterionPercent(criterion.id, v)}
                          />
                        </td>
                        <td className="px-4 py-4 align-middle text-slate-300 text-xs">—</td>
                      </tr>
                    ))}
                    <tr className="bg-violet-50/60 border-t-2 border-violet-200">
                      <td className="px-4 py-4 align-middle">
                        <p className="font-bold text-violet-900">Manager sign-off</p>
                        <input
                          type="text"
                          value={managerName}
                          onChange={(e) => {
                            setManagerName(e.target.value);
                            setSaveMessage(null);
                          }}
                          placeholder="Manager name"
                          className="mt-2 w-full max-w-[200px] rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
                        />
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-300 text-xs">—</td>
                      <td className="px-4 py-4 align-middle">
                        <PercentSlider
                          value={managerPercent}
                          onChange={(v) => {
                            setManagerPercent(v);
                            setSaveMessage(null);
                          }}
                          accent="manager"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                className="inline-flex justify-center items-center gap-2 rounded-xl bg-primary-main px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-main/90 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? "Saving…" : "Save evaluation"}
              </button>
              {saveMessage ? (
                <span
                  className={`text-sm font-semibold ${saveMessage.ok ? "text-emerald-700" : "text-red-600"}`}
                >
                  {saveMessage.text}
                </span>
              ) : null}
              {selectedStaff ? (
                <span className="text-xs text-slate-500 sm:ml-auto">
                  {selectedStaff.full_name} · {evaluationDate}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

type EvaluationSubTab = "score" | "results" | "staff";

const StaffListPanel = () => {
  const [staffList, setStaffList] = useState<StaffMemberRow[]>([]);
  const [branches, setBranches] = useState<BranchSettingRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    full_name: "",
    branch_name: "Main branch",
    role: "",
    phone: "",
    password: "",
  });

  const loadStaff = async () => {
    setLoadError(null);
    const { data, error } = await supabase
      .from("staff_members")
      .select("id,full_name,branch_name,role,phone,sort_order,is_active")
      .order("sort_order", { ascending: true });

    if (error) {
      setLoadError("Could not load staff. Run migration 20260505_staff_users.sql.");
      return;
    }
    setStaffList((data ?? []) as StaffMemberRow[]);
  };

  const loadBranches = async () => {
    const { data } = await supabase
      .from("branch_settings")
      .select("id,branch_name,logo_url,video_url,notes,sort_order")
      .order("sort_order", { ascending: true });
    const rows = (data ?? []) as BranchSettingRow[];
    setBranches(rows);
    if (rows.length > 0) {
      setAddForm((prev) => ({
        ...prev,
        branch_name: prev.branch_name || rows[0].branch_name,
      }));
    }
  };

  useEffect(() => {
    void loadStaff();
    void loadBranches();
  }, []);

  const openAddModal = () => {
    setAddError(null);
    setAddForm({
      full_name: "",
      branch_name: branches[0]?.branch_name ?? "Main branch",
      role: "",
      phone: "",
      password: "",
    });
    setIsAddOpen(true);
  };

  const handleAddStaff = async () => {
    const name = addForm.full_name.trim();
    const branch = addForm.branch_name.trim();
    if (!name) {
      setAddError("Full name is required.");
      return;
    }
    if (!branch) {
      setAddError("Branch is required.");
      return;
    }

    setIsSaving(true);
    setAddError(null);

    const nextOrder =
      staffList.length > 0 ? Math.max(...staffList.map((s) => s.sort_order)) + 1 : 0;

    const insertPayload: Record<string, unknown> = {
      full_name: name,
      branch_name: branch,
      role: addForm.role.trim() || null,
      phone: addForm.phone.trim() || null,
      sort_order: nextOrder,
      is_active: true,
    };

    const plainPassword = addForm.password.trim();
    if (plainPassword) {
      const { data: hash, error: hashError } = await supabase.rpc("hash_password", {
        plain_password: plainPassword,
      });
      if (hashError || !hash) {
        setIsSaving(false);
        setAddError("Could not set password. Run migration 20260505_staff_users.sql.");
        return;
      }
      insertPayload.password_hash = hash;
    }

    const { error } = await supabase.from("staff_members").insert(insertPayload);

    setIsSaving(false);
    if (error) {
      setAddError(
        error.code === "23505" ? "This staff name already exists." : "Could not add staff."
      );
      return;
    }

    setIsAddOpen(false);
    await loadStaff();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Directory</p>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Staff list</h2>
            <p className="text-slate-600 text-sm">
              All staff and user accounts. Edit details in Settings → Staff &amp; users.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-main px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-main/90 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add new staff
          </button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {loadError}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 font-bold text-slate-700">Full name</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Branch</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Role</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Phone</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length === 0 && !loadError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No staff yet. Click &quot;Add new staff&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  staffList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.full_name}</td>
                      <td className="px-4 py-3 text-slate-700">{row.branch_name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.role ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            row.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add new staff</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Full name</span>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                  placeholder="Employee name"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Branch</span>
                <select
                  value={addForm.branch_name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, branch_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                >
                  {branches.length === 0 ? (
                    <option value="Main branch">Main branch</option>
                  ) : (
                    branches.map((b) => (
                      <option key={b.id} value={b.branch_name}>
                        {b.branch_name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Role</span>
                <input
                  type="text"
                  value={addForm.role}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                  placeholder="Barista, server…"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Phone</span>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                  placeholder="+84…"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Password (optional)</span>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                  placeholder="Login password"
                  autoComplete="new-password"
                />
              </label>
              {addError ? (
                <p className="text-sm font-semibold text-red-600">{addError}</p>
              ) : null}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleAddStaff()}
                className="w-full rounded-xl bg-primary-main px-4 py-3 text-sm font-bold text-white hover:bg-primary-main/90 disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Add staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffEvaluationResultsPanel = () => {
  const [filterDate, setFilterDate] = useState(todayIsoDate);
  const [staffList, setStaffList] = useState<StaffMemberRow[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriterionRow[]>([]);
  const [evaluations, setEvaluations] = useState<
    { staff_id: string; criterion_id: string; score: number; evaluator_name: string | null }[]
  >([]);
  const [managerByStaff, setManagerByStaff] = useState<
    Record<string, { percent: number; name: string | null }>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadResults = async (date: string) => {
    setLoadError(null);
    const [
      { data: staffData, error: staffError },
      { data: criteriaData, error: criteriaError },
      { data: evalData, error: evalError },
      { data: managerData, error: managerError },
    ] = await Promise.all([
      supabase.from("staff_members").select("id,full_name,branch_name,role,phone,sort_order,is_active").order("sort_order"),
      supabase.from("evaluation_criteria").select("id,label,max_score,sort_order,is_active").order("sort_order"),
      supabase
        .from("staff_evaluations")
        .select("staff_id,criterion_id,score,evaluator_name")
        .eq("evaluation_date", date),
      supabase
        .from("staff_evaluation_manager")
        .select("staff_id,manager_percent,manager_name")
        .eq("evaluation_date", date),
    ]);

    if (staffError || criteriaError || evalError) {
      setLoadError("Could not load results. Run migration 20260503_staff_evaluation.sql.");
      return;
    }

    setStaffList((staffData ?? []) as StaffMemberRow[]);
    setCriteria((criteriaData ?? []) as EvaluationCriterionRow[]);
    setEvaluations(
      (evalData ?? []) as {
        staff_id: string;
        criterion_id: string;
        score: number;
        evaluator_name: string | null;
      }[]
    );

    const managerMap: Record<string, { percent: number; name: string | null }> = {};
    if (!managerError) {
      for (const row of managerData ?? []) {
        managerMap[row.staff_id as string] = {
          percent: row.manager_percent as number,
          name: (row.manager_name as string) ?? null,
        };
      }
    }
    setManagerByStaff(managerMap);
  };

  useEffect(() => {
    void loadResults(filterDate);
  }, [filterDate]);

  const staffById = Object.fromEntries(staffList.map((s) => [s.id, s]));

  const groupedByStaff = evaluations.reduce<
    Record<string, { scores: Record<string, number>; evaluator: string | null }>
  >((acc, row) => {
    if (!acc[row.staff_id]) {
      acc[row.staff_id] = { scores: {}, evaluator: row.evaluator_name };
    }
    acc[row.staff_id].scores[row.criterion_id] = row.score;
    if (row.evaluator_name) {
      acc[row.staff_id].evaluator = row.evaluator_name;
    }
    return acc;
  }, {});

  const resultRows = Object.entries(groupedByStaff)
    .map(([staffId, data]) => {
      const staff = staffById[staffId];
      const scoreValues = Object.values(data.scores);
      const average =
        scoreValues.length > 0
          ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
          : null;
      const manager = managerByStaff[staffId];
      return { staffId, staff, data, average, manager };
    })
    .filter((row) => row.staff)
    .sort((a, b) => (a.staff?.sort_order ?? 0) - (b.staff?.sort_order ?? 0));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Results</p>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Evaluation report</h2>
          <p className="text-slate-600 text-sm">View staff evaluation scores by day.</p>
        </div>

        <label className="inline-flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-700">Date</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-fit rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
          />
        </label>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {loadError}
          </div>
        )}

        {resultRows.length === 0 && !loadError ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-500 text-sm">
            No evaluations on {filterDate}.
          </div>
        ) : (
          <div className="space-y-4">
            {resultRows.map(({ staffId, staff, data, average, manager }) => (
              <section
                key={staffId}
                className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{staff?.full_name}</h3>
                    {staff?.role ? <p className="text-sm text-slate-500">{staff.role}</p> : null}
                    {data.evaluator ? (
                      <p className="text-xs text-slate-400 mt-1">Evaluated by: {data.evaluator}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Criteria avg</p>
                      <p className="text-2xl font-bold text-primary-main">
                        {average != null ? `${average}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-violet-500">Manager sign-off</p>
                      <p className="text-2xl font-bold text-violet-700">
                        {manager ? `${manager.percent}%` : "—"}
                      </p>
                      {manager?.name ? (
                        <p className="text-[10px] text-slate-400">{manager.name}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {criteria
                    .filter((c) => c.is_active)
                    .map((criterion) => {
                      const score = data.scores[criterion.id];
                      return (
                        <div
                          key={criterion.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700 font-medium">{criterion.label}</span>
                          <span
                            className={`font-bold ${score != null ? "text-emerald-700" : "text-slate-400"}`}
                          >
                            {score != null ? `${score}%` : "—"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EvaluationPage = () => {
  const [subTab, setSubTab] = useState<EvaluationSubTab>("score");

  return (
    <main className="w-full h-full min-h-0 flex flex-col relative z-10 bg-white/78 backdrop-blur-[3px]">
      <div className="shrink-0 flex gap-2 p-3 md:p-4 border-b border-slate-200/80 bg-white/90">
        <button
          type="button"
          onClick={() => setSubTab("score")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            subTab === "score"
              ? "bg-primary-main text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Star className="w-4 h-4" />
          Score
        </button>
        <button
          type="button"
          onClick={() => setSubTab("results")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            subTab === "results"
              ? "bg-primary-main text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Results
        </button>
        <button
          type="button"
          onClick={() => setSubTab("staff")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            subTab === "staff"
              ? "bg-primary-main text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff list
        </button>
      </div>
      {subTab === "score" ? (
        <StaffEvaluationPanel />
      ) : subTab === "results" ? (
        <StaffEvaluationResultsPanel />
      ) : (
        <StaffListPanel />
      )}
    </main>
  );
};

const TableSettings = () => {
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("branches");
  const [branches, setBranches] = useState<BranchSettingRow[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriterionRow[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberRow[]>([]);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const loadBranches = async () => {
    setLoadError(null);
    const { data, error } = await supabase
      .from("branch_settings")
      .select("id,branch_name,logo_url,video_url,notes,sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      setLoadError("Could not load branches. Run migration 20260502_branch_settings.sql in Supabase.");
      setBranches([]);
      return;
    }
    setBranches((data ?? []) as BranchSettingRow[]);
  };

  const loadCriteria = async () => {
    const { data, error } = await supabase
      .from("evaluation_criteria")
      .select("id,label,description,max_score,sort_order,is_active")
      .order("sort_order", { ascending: true });

    if (error) {
      setLoadError("Could not load criteria. Run migration 20260503_staff_evaluation.sql.");
      setCriteria([]);
      return;
    }
    setCriteria((data ?? []) as EvaluationCriterionRow[]);
  };

  const loadStaffMembers = async () => {
    const { data, error } = await supabase
      .from("staff_members")
      .select("id,full_name,branch_name,role,phone,sort_order,is_active")
      .order("sort_order", { ascending: true });

    if (error) {
      setLoadError("Could not load staff. Run migration 20260505_staff_users.sql.");
      setStaffMembers([]);
      return;
    }
    setStaffMembers((data ?? []) as StaffMemberRow[]);
  };

  useEffect(() => {
    void loadBranches();
    void loadCriteria();
    void loadStaffMembers();
  }, []);

  const updateCriterionField = (
    id: string,
    field: keyof EvaluationCriterionRow,
    value: string | number | boolean
  ) => {
    setCriteria((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setRowMessage(null);
  };

  const saveCriterionRow = async (row: EvaluationCriterionRow) => {
    setRowMessage(null);
    const label = row.label.trim();
    if (!label) {
      setRowMessage({ id: row.id, text: "Criterion name is required.", ok: false });
      return;
    }
    const { error } = await supabase
      .from("evaluation_criteria")
      .update({
        label,
        description: row.description?.trim() || null,
        max_score: row.max_score,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })
      .eq("id", row.id);

    if (error) {
      setRowMessage({
        id: row.id,
        text: error.code === "23505" ? "This criterion already exists." : "Save failed.",
        ok: false,
      });
      return;
    }
    setRowMessage({ id: row.id, text: "Saved.", ok: true });
    await loadCriteria();
  };

  const addCriterion = async () => {
    setRowMessage(null);
    const nextOrder =
      criteria.length > 0 ? Math.max(...criteria.map((c) => c.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from("evaluation_criteria")
      .insert({
        label: `New criterion ${nextOrder + 1}`,
        description: "",
        max_score: 5,
        sort_order: nextOrder,
        is_active: true,
      })
      .select("id,label,description,max_score,sort_order,is_active")
      .single();

    if (error || !data) {
      setLoadError("Could not add criterion.");
      return;
    }
    setCriteria((prev) => [...prev, data as EvaluationCriterionRow]);
    setRowMessage({ id: (data as EvaluationCriterionRow).id, text: "Added — edit and Save.", ok: true });
  };

  const deleteCriterionRow = async (row: EvaluationCriterionRow) => {
    if (!window.confirm(`Delete criterion "${row.label}"?`)) {
      return;
    }
    const { error } = await supabase.from("evaluation_criteria").delete().eq("id", row.id);
    if (error) {
      setRowMessage({ id: row.id, text: "Delete failed.", ok: false });
      return;
    }
    setCriteria((prev) => prev.filter((c) => c.id !== row.id));
  };

  const updateStaffField = (
    id: string,
    field: keyof StaffMemberRow,
    value: string | number | boolean
  ) => {
    setStaffMembers((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setRowMessage(null);
  };

  const saveStaffRow = async (row: StaffMemberRow) => {
    setRowMessage(null);
    const name = row.full_name.trim();
    const branch = row.branch_name.trim();
    if (!name) {
      setRowMessage({ id: row.id, text: "Staff name is required.", ok: false });
      return;
    }
    if (!branch) {
      setRowMessage({ id: row.id, text: "Branch is required.", ok: false });
      return;
    }

    const payload: Record<string, unknown> = {
      full_name: name,
      branch_name: branch,
      role: row.role?.trim() || null,
      phone: row.phone?.trim() || null,
      sort_order: row.sort_order,
      is_active: row.is_active,
    };

    const plainPassword = passwordDrafts[row.id]?.trim();
    if (plainPassword) {
      const { data: hash, error: hashError } = await supabase.rpc("hash_password", {
        plain_password: plainPassword,
      });
      if (hashError || !hash) {
        setRowMessage({
          id: row.id,
          text: hashError?.message?.includes("hash_password")
            ? "Password save failed. Run migration 20260505_staff_users.sql."
            : "Could not hash password.",
          ok: false,
        });
        return;
      }
      payload.password_hash = hash;
    }

    const { error } = await supabase.from("staff_members").update(payload).eq("id", row.id);

    if (error) {
      setRowMessage({
        id: row.id,
        text: error.code === "23505" ? "This staff name already exists." : "Save failed.",
        ok: false,
      });
      return;
    }
    setPasswordDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setRowMessage({ id: row.id, text: "Saved.", ok: true });
    await loadStaffMembers();
  };

  const addStaffMember = async () => {
    setRowMessage(null);
    const nextOrder =
      staffMembers.length > 0 ? Math.max(...staffMembers.map((s) => s.sort_order)) + 1 : 0;
    const defaultBranch = branches[0]?.branch_name ?? "Main branch";
    const { data, error } = await supabase
      .from("staff_members")
      .insert({
        full_name: `New staff ${nextOrder + 1}`,
        branch_name: defaultBranch,
        role: "",
        phone: "",
        sort_order: nextOrder,
        is_active: true,
      })
      .select("id,full_name,branch_name,role,phone,sort_order,is_active")
      .single();

    if (error || !data) {
      setLoadError("Could not add staff member.");
      return;
    }
    setStaffMembers((prev) => [...prev, data as StaffMemberRow]);
    setRowMessage({ id: (data as StaffMemberRow).id, text: "Added — edit and Save.", ok: true });
  };

  const deleteStaffRow = async (row: StaffMemberRow) => {
    if (!window.confirm(`Delete staff "${row.full_name}"?`)) {
      return;
    }
    const { error } = await supabase.from("staff_members").delete().eq("id", row.id);
    if (error) {
      setRowMessage({ id: row.id, text: "Delete failed.", ok: false });
      return;
    }
    setStaffMembers((prev) => prev.filter((s) => s.id !== row.id));
  };

  const updateBranchField = (id: string, field: keyof BranchSettingRow, value: string) => {
    setBranches((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setRowMessage(null);
  };

  const handleBranchLogoFile = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file?.type.startsWith("image/")) {
      setRowMessage({ id, text: "Please choose an image file.", ok: false });
      return;
    }
    try {
      const base64 = await convertFileToBase64(file);
      updateBranchField(id, "logo_url", base64);
      setRowMessage({ id, text: "Logo loaded — click Save row to persist.", ok: true });
    } catch {
      setRowMessage({ id, text: "Could not read image.", ok: false });
    }
  };

  const saveBranchRow = async (row: BranchSettingRow) => {
    setRowMessage(null);
    const name = row.branch_name.trim();
    if (!name) {
      setRowMessage({ id: row.id, text: "Branch name is required.", ok: false });
      return;
    }
    const { error } = await supabase
      .from("branch_settings")
      .update({
        branch_name: name,
        logo_url: row.logo_url.trim(),
        video_url: row.video_url.trim(),
        notes: row.notes?.trim() || null,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);

    if (error) {
      setRowMessage({
        id: row.id,
        text: error.message.includes("duplicate") || error.code === "23505"
          ? "Another branch already uses this name."
          : "Save failed. Check Supabase policies and try again.",
        ok: false,
      });
      return;
    }
    setRowMessage({ id: row.id, text: "Saved.", ok: true });
    await loadBranches();
  };

  const addBranch = async () => {
    setRowMessage(null);
    const nextOrder =
      branches.length > 0 ? Math.max(...branches.map((b) => b.sort_order)) + 1 : 0;
    const baseName = "New branch";
    let candidate = `${baseName} ${nextOrder + 1}`;
    let n = nextOrder + 1;
    while (branches.some((b) => b.branch_name === candidate)) {
      n += 1;
      candidate = `${baseName} ${n}`;
    }

    const { data, error } = await supabase
      .from("branch_settings")
      .insert({
        branch_name: candidate,
        logo_url: "",
        video_url: "",
        notes: "",
        sort_order: nextOrder,
      })
      .select("id,branch_name,logo_url,video_url,notes,sort_order")
      .single();

    if (error || !data) {
      setLoadError("Could not add branch. Check migration and insert policy.");
      return;
    }
    setBranches((prev) => [...prev, data as BranchSettingRow]);
    setRowMessage({ id: (data as BranchSettingRow).id, text: "New row added — edit and Save row.", ok: true });
  };

  const deleteBranchRow = async (row: BranchSettingRow) => {
    if (!window.confirm(`Delete branch "${row.branch_name}"? This cannot be undone.`)) {
      return;
    }
    setRowMessage(null);
    const { error } = await supabase.from("branch_settings").delete().eq("id", row.id);
    if (error) {
      setRowMessage({ id: row.id, text: "Delete failed.", ok: false });
      return;
    }
    setBranches((prev) => prev.filter((b) => b.id !== row.id));
  };

  const settingsTabs: { id: SettingsSection; label: string }[] = [
    { id: "branches", label: "Branches" },
    { id: "criteria", label: "Evaluation criteria" },
    { id: "staff", label: "Staff & users" },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent scrollbar-hide">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Configuration</p>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-600 text-sm max-w-2xl">
              Manage branches, evaluation criteria, and staff user accounts.
            </p>
          </div>
          {settingsSection === "branches" ? (
            <button
              type="button"
              onClick={() => void addBranch()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-main px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-main/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add branch
            </button>
          ) : settingsSection === "criteria" ? (
            <button
              type="button"
              onClick={() => void addCriterion()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-main px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-main/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add criterion
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void addStaffMember()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-main px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-main/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add staff / user
            </button>
          )}
        </div>

        <nav className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSettingsSection(tab.id);
                setRowMessage(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                settingsSection === tab.id
                  ? "bg-white text-primary-main shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {loadError}
          </div>
        )}

        {settingsSection === "branches" ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">Branch</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[200px]">Logo URL / Base64</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[200px]">Video URL</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[180px]">Notes</th>
                  <th className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">Preview</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.length === 0 && !loadError ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No branches yet. Click &quot;Add branch&quot; or run the database migration.
                    </td>
                  </tr>
                ) : (
                  branches.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.branch_name}
                          onChange={(e) => updateBranchField(row.id, "branch_name", e.target.value)}
                          className="w-full min-w-[140px] rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="Branch name"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={row.logo_url}
                          onChange={(e) => updateBranchField(row.id, "logo_url", e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="https://… or paste Base64 data URL"
                        />
                        <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleBranchLogoFile(row.id, e)}
                          />
                          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50">
                            Upload logo
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={row.video_url}
                          onChange={(e) => updateBranchField(row.id, "video_url", e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="MP4 URL or Google Drive /preview link"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={row.notes ?? ""}
                          onChange={(e) => updateBranchField(row.id, "notes", e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="Other parameters, contacts, hours…"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2 w-28">
                          <div className="aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                            {row.logo_url ? (
                              <img
                                src={row.logo_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 text-center px-1">
                                No logo
                              </div>
                            )}
                          </div>
                          {row.video_url ? (
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[7rem]" title={row.video_url}>
                              Video set
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => void saveBranchRow(row)}
                            className="rounded-lg bg-primary-main px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-main/90"
                          >
                            Save row
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteBranchRow(row)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                          {rowMessage?.id === row.id ? (
                            <span
                              className={`text-xs font-semibold max-w-[140px] ${rowMessage.ok ? "text-emerald-700" : "text-red-600"}`}
                            >
                              {rowMessage.text}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}

        {settingsSection === "criteria" ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 font-bold text-slate-700">Criterion</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[240px]">Description</th>
                  <th className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">Active</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      No criteria yet. Click &quot;Add criterion&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  criteria.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateCriterionField(row.id, "label", e.target.value)}
                          className="w-full min-w-[140px] rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={row.description ?? ""}
                          onChange={(e) => updateCriterionField(row.id, "description", e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="Criterion description…"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={row.is_active}
                          onChange={(e) => updateCriterionField(row.id, "is_active", e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => void saveCriterionRow(row)}
                            className="rounded-lg bg-primary-main px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-main/90"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCriterionRow(row)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                          {rowMessage?.id === row.id ? (
                            <span
                              className={`text-xs font-semibold max-w-[140px] ${rowMessage.ok ? "text-emerald-700" : "text-red-600"}`}
                            >
                              {rowMessage.text}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">
            Score on a 0–100% scale in the Evaluation tab.
          </p>
        </section>
        ) : null}

        {settingsSection === "staff" ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[140px]">Full name</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[120px]">Branch</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[100px]">Role</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[120px]">Phone</th>
                  <th className="px-4 py-3 font-bold text-slate-700 min-w-[140px]">Password</th>
                  <th className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">Active</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No staff yet. Click &quot;Add staff / user&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.full_name}
                          onChange={(e) => updateStaffField(row.id, "full_name", e.target.value)}
                          className="w-full min-w-[120px] rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.branch_name}
                          onChange={(e) => updateStaffField(row.id, "branch_name", e.target.value)}
                          className="w-full min-w-[120px] rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                        >
                          {branches.length === 0 ? (
                            <option value={row.branch_name}>{row.branch_name}</option>
                          ) : (
                            branches.map((b) => (
                              <option key={b.id} value={b.branch_name}>
                                {b.branch_name}
                              </option>
                            ))
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.role ?? ""}
                          onChange={(e) => updateStaffField(row.id, "role", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="Barista, server…"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="tel"
                          value={row.phone ?? ""}
                          onChange={(e) => updateStaffField(row.id, "phone", e.target.value)}
                          className="w-full min-w-[110px] rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="+84…"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="password"
                          value={passwordDrafts[row.id] ?? ""}
                          onChange={(e) => {
                            setPasswordDrafts((prev) => ({ ...prev, [row.id]: e.target.value }));
                            setRowMessage(null);
                          }}
                          className="w-full min-w-[120px] rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-main/25"
                          placeholder="New password"
                          autoComplete="new-password"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Blank = keep current</p>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={row.is_active}
                          onChange={(e) => updateStaffField(row.id, "is_active", e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => void saveStaffRow(row)}
                            className="rounded-lg bg-primary-main px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-main/90"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteStaffRow(row)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                          {rowMessage?.id === row.id ? (
                            <span
                              className={`text-xs font-semibold max-w-[140px] ${rowMessage.ok ? "text-emerald-700" : "text-red-600"}`}
                            >
                              {rowMessage.text}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">
            Passwords are stored as bcrypt hashes. Active staff appear in Evaluation and the Staff list tab.
          </p>
        </section>
        ) : null}

        <p className="text-xs text-slate-500">
          {settingsSection === "branches"
            ? "Click Save after editing a branch."
            : settingsSection === "criteria"
              ? "Active criteria appear in the Evaluation tab."
              : "Manage staff users (name, branch, role, phone, password) for evaluation."}
        </p>
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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskForm, setAddTaskForm] = useState({
    categoryId: "",
    name: "",
    image: "",
    videoUrl: "",
  });
  const [addTaskError, setAddTaskError] = useState<string | null>(null);
  const [addTaskImageUploadError, setAddTaskImageUploadError] = useState<string | null>(null);

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

      const [
        { data: categories, error: categoriesError },
        { data: tasks, error: tasksError },
        { data: selections, error: selectionsError },
      ] = await Promise.all([
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
        supabase.from("dashboard_task_selections").select("task_id"),
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

      if (!selectionsError && selections?.length) {
        setSelectedDashboardItems(selections.map((row: { task_id: string }) => row.task_id));
      }
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
    const willSelect = !selectedDashboardItems.includes(itemId);
    setSelectedDashboardItems((prev) =>
      willSelect ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );

    if (supabaseStatus !== "connected") {
      return;
    }

    void (async () => {
      if (willSelect) {
        const { error } = await supabase
          .from("dashboard_task_selections")
          .upsert({ task_id: itemId }, { onConflict: "task_id" });
        if (error) {
          setSelectedDashboardItems((prev) => prev.filter((id) => id !== itemId));
        }
      } else {
        const { error } = await supabase
          .from("dashboard_task_selections")
          .delete()
          .eq("task_id", itemId);
        if (error) {
          setSelectedDashboardItems((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
        }
      }
    })();
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

  const handleSaveNewTask = async () => {
    const name = addTaskForm.name.trim();
    const image = addTaskForm.image.trim();
    const videoUrl = addTaskForm.videoUrl.trim();
    if (!name || !image || !addTaskForm.categoryId) {
      setAddTaskError("Name, image, and category are required.");
      return;
    }
    setAddTaskError(null);

    const category = dashboardData.find((c) => c.id === addTaskForm.categoryId);
    if (!category) {
      setAddTaskError("Category not found.");
      return;
    }

    const newItem: MenuItem = {
      id: `local-${Date.now()}`,
      name,
      image,
      videoUrl: videoUrl || undefined,
    };

    if (supabaseStatus === "connected" && category.dbCategoryId) {
      const { data: maxRow } = await supabase
        .from("dashboard_tasks")
        .select("sort_order")
        .eq("category_id", category.dbCategoryId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSort = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 1;

      const { data: inserted, error } = await supabase
        .from("dashboard_tasks")
        .insert({
          category_id: category.dbCategoryId,
          task_name: name,
          image_url: image,
          video_url: videoUrl || null,
          is_special: false,
          sort_order: nextSort,
        })
        .select("id,task_name,image_url,video_url")
        .single();

      if (error) {
        setAddTaskError(
          error.message.includes("duplicate") || error.code === "23505"
            ? "A task with this name already exists in this column."
            : "Could not save task. Run latest DB migrations (insert policy) and try again."
        );
        return;
      }

      if (inserted) {
        newItem.id = inserted.id;
        newItem.name = inserted.task_name;
        newItem.image = inserted.image_url;
        newItem.videoUrl = inserted.video_url ?? undefined;
      }
    }

    setDashboardData((prev) =>
      prev.map((cat) =>
        cat.id === addTaskForm.categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
      )
    );
    setIsAddTaskOpen(false);
  };

  const handleAddTaskImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      setAddTaskImageUploadError("Please select a valid image file.");
      return;
    }
    try {
      const base64Image = await convertFileToBase64(selectedFile);
      setAddTaskForm((prev) => ({ ...prev, image: base64Image }));
      setAddTaskImageUploadError(null);
    } catch {
      setAddTaskImageUploadError("Cannot upload image. Please try another file.");
    } finally {
      event.target.value = "";
    }
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
              { id: "evaluation", label: "Evaluation", icon: <Star className="w-4 h-4" /> },
              { id: "settings", label: "Settings", icon: <Settings2 className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  (item.id === "checkwwork" ||
                    item.id === "dashboard" ||
                    item.id === "operations" ||
                    item.id === "evaluation" ||
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
          {activeTab === "checkwwork" && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setAddTaskError(null);
                setAddTaskImageUploadError(null);
                setAddTaskForm({
                  categoryId: dashboardData[0]?.id ?? "",
                  name: "",
                  image: "",
                  videoUrl: "",
                });
                setIsAddTaskOpen(true);
              }}
              className="flex bg-primary-main text-white px-5 py-2.5 rounded-xl font-bold text-sm items-center gap-2 hover:bg-primary-main/90 transition-all shadow-md shadow-primary-main/10"
            >
              <Plus className="w-5 h-5" /> Add Task
            </motion.button>
          )}
          
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

      {/* Main Content Area — centered brand watermark behind all views */}
      <div className="flex-1 overflow-hidden relative bg-surface">
        <div
          className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_50%,color-mix(in_oklab,var(--color-primary-main)_14%,transparent)_0%,transparent_62%)]" />
          <img
            src={BRAND_LOGO_URL}
            alt=""
            className="relative w-[min(72vmin,26rem)] h-[min(72vmin,26rem)] object-cover rounded-[2rem] opacity-[0.28] shadow-2xl shadow-primary-main/15 ring-1 ring-primary-main/10 saturate-[0.92] contrast-[1.08]"
          />
        </div>
        <AnimatePresence mode="wait">
          {activeTab === "checkwwork" ? (
            <motion.main 
              key="checkwwork"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full h-full min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 bg-white/78 backdrop-blur-[3px]"
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
          ) : activeTab === "evaluation" ? (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-0 relative z-10 overflow-hidden"
            >
              <EvaluationPage />
            </motion.div>
          ) : activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-0 relative z-10 overflow-hidden bg-white/78 backdrop-blur-[3px]"
            >
              <DailyReportDashboard />
            </motion.div>
          ) : activeTab === "operations" ? (
            <motion.div
              key="operations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-0 relative z-10 overflow-hidden bg-white/78 backdrop-blur-[3px]"
            >
              <OperationsDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-0 relative z-10 overflow-hidden bg-white/78 backdrop-blur-[3px]"
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
          { id: "evaluation", label: "Evaluation", icon: <Star /> },
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
                item.id === "evaluation" ||
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

      {isAddTaskOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add task</h3>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Column</span>
                <select
                  value={addTaskForm.categoryId}
                  onChange={(e) =>
                    setAddTaskForm((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                >
                  {dashboardData.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Name</span>
                <input
                  type="text"
                  value={addTaskForm.name}
                  onChange={(e) => setAddTaskForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Image (URL or Base64)</span>
                <input
                  type="text"
                  value={addTaskForm.image}
                  onChange={(e) => {
                    setAddTaskForm((prev) => ({ ...prev, image: e.target.value }));
                    if (addTaskImageUploadError) {
                      setAddTaskImageUploadError(null);
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
                  onChange={handleAddTaskImageFileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-main/10 file:px-3 file:py-1.5 file:text-primary-main file:font-bold hover:file:bg-primary-main/20"
                />
                {addTaskImageUploadError && (
                  <p className="text-sm text-red-600">{addTaskImageUploadError}</p>
                )}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Video URL</span>
                <input
                  type="url"
                  value={addTaskForm.videoUrl}
                  onChange={(e) => setAddTaskForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-main/30"
                />
              </label>
              {addTaskError && <p className="text-sm text-red-600">{addTaskError}</p>}

              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Image preview
                </p>
                {addTaskForm.image ? (
                  <img
                    src={addTaskForm.image}
                    alt={addTaskForm.name || "Preview"}
                    className="w-full h-44 object-cover rounded-lg bg-gray-50"
                  />
                ) : (
                  <div className="w-full h-44 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                    No image yet
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveNewTask()}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-primary-main hover:bg-primary-main/90"
              >
                Add task
              </button>
            </div>
          </div>
        </div>
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
