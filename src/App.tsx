/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import React, { ReactNode, useState } from "react";
import { 
  Leaf, 
  Cake, 
  Utensils, 
  ExternalLink, 
  Sparkles,
  Flame,
  Plus,
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

interface MenuItem {
  id: string;
  name: string;
  image: string;
  urgent?: string;
  info?: string;
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
}

const TaskCard = ({ item, color, index }: TaskCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      className="group flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95"
    >
      <div className="relative overflow-hidden rounded-xl w-20 h-20 flex-shrink-0">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg leading-tight text-gray-900 truncate">{item.name}</h3>
        {item.urgent && (
          <p className="text-sm font-bold text-tertiary-main mt-1 animate-pulse flex items-center gap-1">
            <Flame className="w-3 h-3" /> {item.urgent}
          </p>
        )}
        {item.info && (
          <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-secondary-main" /> {item.info}
          </p>
        )}
      </div>

      <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:text-current transition-colors">
        <ExternalLink className={`w-6 h-6 ${
          color === "primary" ? "group-hover:text-primary-main" : 
          color === "secondary" ? "group-hover:text-secondary-main" : 
          "group-hover:text-tertiary-main"
        }`} />
      </div>
    </motion.div>
  );
};

interface CategoryColumnProps {
  key?: React.Key;
  category: Category;
}

const CategoryColumn = ({ category }: CategoryColumnProps) => {
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
            <TaskCard key={item.id} item={item} color={category.color} index={idx} />
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
                  <TaskCard key={item.id} item={item} color={category.color} index={idx + category.items.length} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const OperationsDashboard = () => {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white scrollbar-hide">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-on-background mb-2">Checklist Management</h1>
            <p className="text-gray-500 font-medium">Manage daily operational task lists for kitchen staff.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* LEFT COLUMN: Checklist work */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-display font-bold text-secondary-main">Checklist work</h2>
              <button className="flex items-center gap-1.5 text-secondary-main font-bold text-sm bg-secondary-main/10 px-4 py-2 rounded-full hover:bg-secondary-main/20 transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Closing Team Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Closing team</h3>
              <div className="space-y-3">
                {[
                  { id: "c1", icon: <Sparkles />, label: "Sanitize all prep surfaces and stations", color: "text-purple-600", bg: "bg-purple-100" },
                  { id: "c2", icon: <ShieldCheck />, label: "Secure all dry storage and cold rooms", color: "text-purple-600", bg: "bg-purple-100" },
                  { id: "c3", icon: <Box />, label: "Complete evening inventory waste log", color: "text-purple-600", bg: "bg-purple-100" },
                ].map((task) => (
                  <motion.div 
                    key={task.id}
                    whileHover={{ x: 4 }}
                    className="group bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-secondary-main/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${task.bg} ${task.color}`}>
                        {React.cloneElement(task.icon as React.ReactElement, { className: "w-5 h-5" })}
                      </div>
                      <span className="font-medium text-gray-700">{task.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-secondary-main transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Opening Team Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Opening team</h3>
              <div className="space-y-3">
                {[
                  { id: "o1", icon: <Thermometer />, label: "Check refrigerator & freezer temperatures", color: "text-pink-600", bg: "bg-pink-100" },
                  { id: "o2", icon: <FileText />, label: "Review deliveries and invoice validation", color: "text-pink-600", bg: "bg-pink-100" },
                ].map((task) => (
                  <motion.div 
                    key={task.id}
                    whileHover={{ x: 4 }}
                    className="group bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-secondary-main/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${task.bg} ${task.color}`}>
                        {React.cloneElement(task.icon as React.ReactElement, { className: "w-5 h-5" })}
                      </div>
                      <span className="font-medium text-gray-700">{task.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-secondary-main transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Checklist DONE */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-display font-bold text-primary-main">Checklist DONE</h2>
              <button className="flex items-center gap-1.5 text-secondary-main font-bold text-sm bg-secondary-main/10 px-4 py-2 rounded-full hover:bg-secondary-main/20 transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Add
              </button>
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
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-4">Closing team</h3>
                <div className="space-y-2">
                  {[
                    { id: "d1", label: "Empty grease traps & oil disposal", date: "24 May 2024", time: "22:45" },
                    { id: "d2", label: "Dishwasher cycle finish & drain", date: "24 May 2024", time: "23:15" },
                  ].map((task) => (
                    <motion.div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-xl group border border-transparent hover:border-gray-200 transition-all">
                      <div className="col-span-1 md:col-span-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary-main fill-primary-main/10" />
                        <span className="font-medium text-gray-400 line-through truncate">{task.label}</span>
                      </div>
                      <div className="col-span-1 md:col-span-3 text-sm font-semibold text-gray-500">{task.date}</div>
                      <div className="col-span-1 md:col-span-2 text-right text-sm font-bold text-gray-500">{task.time}</div>
                      <div className="col-span-1 text-right">
                        <button className="text-tertiary-main opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-tertiary-main/10 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Opening Team Done */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-4">Opening team</h3>
                <div className="space-y-2">
                  {[
                    { id: "od1", label: "Unlock staff entry & clock-in", date: "25 May 2024", time: "05:30" },
                    { id: "od2", label: "Coffee machine calibration & purge", date: "25 May 2024", time: "06:00" },
                  ].map((task) => (
                    <motion.div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-xl group border border-transparent hover:border-gray-200 transition-all">
                      <div className="col-span-1 md:col-span-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary-main fill-primary-main/10" />
                        <span className="font-medium text-gray-400 line-through truncate">{task.label}</span>
                      </div>
                      <div className="col-span-1 md:col-span-3 text-sm font-semibold text-gray-500">{task.date}</div>
                      <div className="col-span-1 md:col-span-2 text-right text-sm font-bold text-gray-500">{task.time}</div>
                      <div className="col-span-1 text-right">
                        <button className="text-tertiary-main opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-tertiary-main/10 rounded-lg">
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
    </main>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "operations">("dashboard");

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm antialiased">
        <div className="flex items-center gap-10">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 bg-primary-main rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-main/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-display font-black tracking-tight text-gray-900">CulinaryOps</span>
          </motion.div>
          
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: "operations", label: "Operations", icon: <Settings2 className="w-4 h-4" /> },
              { id: "inventory", label: "Inventory", icon: <Box className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => (item.id === "dashboard" || item.id === "operations") && setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? "bg-white text-primary-main shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
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
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" ? (
            <motion.main 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {DASHBOARD_DATA.map((category) => (
                <CategoryColumn key={category.id} category={category} />
              ))}
            </motion.main>
          ) : (
            <motion.div
              key="operations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full"
            >
              <OperationsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-gray-900/90 backdrop-blur-lg border border-white/10 flex justify-around py-3 px-6 rounded-2xl shadow-2xl z-50">
        {[
          { id: "dashboard", label: "Home", icon: <LayoutDashboard /> },
          { id: "operations", label: "Tasks", icon: <ClipboardList /> },
          { id: "inventory", label: "Stock", icon: <Box /> },
          { id: "team", label: "Team", icon: <Users /> },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => (item.id === "dashboard" || item.id === "operations") && setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id ? "text-white" : "text-gray-500"
            }`}
          >
            {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6" })}
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
